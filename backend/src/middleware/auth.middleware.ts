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

// JWKS cache: kid → PEM public key
let jwksCache: Map<string, string> | null = null;

async function fetchJwks(): Promise<Map<string, string>> {
  const url = `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  const { keys } = await res.json() as { keys: JsonWebKey[] };
  const map = new Map<string, string>();
  for (const key of keys) {
    if (!key.kid) continue;
    const pub = createPublicKey({ key, format: 'jwk' });
    map.set(key.kid as string, pub.export({ type: 'spki', format: 'pem' }) as string);
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
  try {
    const [rawHeader] = token.split('.');
    const { kid } = JSON.parse(Buffer.from(rawHeader, 'base64url').toString()) as { kid: string };
    const publicKey = await getPublicKey(kid);
    const payload = jwt.verify(token, publicKey, { algorithms: ['ES256'] }) as jwt.JwtPayload;
    const userId = payload.sub!;

    let profile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId) });
    if (!profile) {
      // First ever user gets admin role; all subsequent users get 'user'
      const count = await db.$count(userProfiles);
      const role = count === 0 ? 'admin' : 'user';
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
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
