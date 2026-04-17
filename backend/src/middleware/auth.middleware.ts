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
    interface Request { user?: AuthUser; }
  }
}

// Lazily-created Supabase admin client (service role key required for auth.getUser)
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return _supabaseAdmin;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const userId = data.user.id;
    const email: string = data.user.email ?? '';

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
    const err = error as { message?: string };
    console.error('[auth] middleware error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
