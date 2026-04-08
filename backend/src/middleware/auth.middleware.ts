import { createClient } from '@supabase/supabase-js';
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
    interface Request {
      user?: AuthUser;
    }
  }
}

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    // Verify token via Supabase — works with both ECC (P-256) and legacy HS256 keys
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    const userId = data.user.id;

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
