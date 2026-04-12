import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { userProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthUser {
  userId: string;
  role: 'admin' | 'user';
  monthlySpendUsd: number;
}

declare global {
  namespace Express {
    interface Request { user?: AuthUser; }
  }
}

interface JwkKey {
  kid: string;
  kty: string;
  alg: string;
  [k: string]: unknown;
}

// JWKS cache: kid → PEM public key
let jwksCache: Map<string, string> | null = null;

async function fetchJwks(): Promise<Map<string, string>> {
  const url = `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  const { keys } = await res.json() as { keys: JwkKey[] };
  const map = new Map<string, string>();
  for (const key of keys) {
    if (!key.kid) continue;
    const pub = createPublicKey({ key: key as unknown as import('crypto').JsonWebKey, format: 'jwk' });
    map.set(key.kid, pub.export({ type: 'spki', format: 'pem' }) as string);
  }
  return map;
}

async function getPublicKey(kid: string): Promise<string> {
  if (!jwksCache) jwksCache = await fetchJwks();
  if (!jwksCache.has(kid)) {
    // Possible key rotation — refetch once before failing
    jwksCache = await fetchJwks();
  }
  const pem = jwksCache.get(kid);
  if (!pem) throw new Error(`Unknown kid: ${kid}`);
  return pem;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  let stage = 'token_received';
  try {
    stage = 'decode_header';
    const [rawHeader] = token.split('.');
    const { kid } = JSON.parse(Buffer.from(rawHeader, 'base64url').toString()) as { kid: string };
    stage = 'get_public_key';
    const publicKey = await getPublicKey(kid);
    stage = 'verify_jwt';
    const payload = jwt.verify(token, publicKey, { algorithms: ['ES256'] }) as jwt.JwtPayload;
    const userId = payload.sub!;
    const email: string = (payload.email as string | undefined) ?? '';

    stage = 'db_profile_lookup';
    let profile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId) });
    if (!profile) {
      const adminEmails = (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';
      [profile] = await db.insert(userProfiles).values({ userId, role }).returning();
    }

    // Reset monthly spend if calendar month has changed
    const now = new Date();
    const resetAt = new Date(profile.monthlyResetAt);
    if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
      [profile] = await db.update(userProfiles)
        .set({ monthlySpendUsd: '0', monthlyResetAt: now })
        .where(eq(userProfiles.userId, userId))
        .returning();
    }

    req.user = {
      userId,
      role: profile.role as 'admin' | 'user',
      monthlySpendUsd: parseFloat(profile.monthlySpendUsd ?? '0'),
    };
    next();
  } catch (error) {
    const err = error as { message?: string; name?: string };
    console.error(`[auth] JWT validation failed at stage="${stage}":`, err.name, err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
