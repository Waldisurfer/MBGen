import { db } from '../db/client';
import { userProfiles } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export const MONTHLY_LIMIT_USD = 0.10;

export async function checkSpendLimit(userId: string, role: string, estimatedCost: number): Promise<void> {
  if (role === 'admin') return;
  const profile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId) });
  const current = parseFloat(profile?.monthlySpendUsd ?? '0');
  if (current + estimatedCost > MONTHLY_LIMIT_USD) {
    const remaining = Math.max(0, MONTHLY_LIMIT_USD - current);
    const err = new Error(
      `Monthly budget limit reached. $${remaining.toFixed(4)} remaining of $${MONTHLY_LIMIT_USD.toFixed(2)}`
    ) as Error & { status: number };
    err.status = 402;
    throw err;
  }
}

export async function recordSpend(userId: string, costUsd: number): Promise<void> {
  await db.update(userProfiles)
    .set({ monthlySpendUsd: sql`monthly_spend_usd + ${costUsd.toString()}` })
    .where(eq(userProfiles.userId, userId));
}
