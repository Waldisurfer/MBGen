import { Request, Response } from 'express';
import { db } from '../db/client';
import { userProfiles, generations } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { MONTHLY_LIMIT_USD } from '../utils/spend';

export async function listUsersHandler(_req: Request, res: Response): Promise<void> {
  const profiles = await db.select().from(userProfiles).orderBy(desc(userProfiles.createdAt));
  res.json(profiles.map(p => ({
    id: p.id,
    userId: p.userId,
    role: p.role,
    status: p.status,
    monthlySpendUsd: parseFloat(p.monthlySpendUsd ?? '0'),
    monthlyLimitUsd: MONTHLY_LIMIT_USD,
    spendPercent: Math.round((parseFloat(p.monthlySpendUsd ?? '0') / MONTHLY_LIMIT_USD) * 100),
    monthlyResetAt: p.monthlyResetAt,
    createdAt: p.createdAt,
  })));
}

export async function resetUserSpendHandler(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const [updated] = await db.update(userProfiles)
    .set({ monthlySpendUsd: '0', monthlyResetAt: new Date() })
    .where(eq(userProfiles.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ success: true });
}

export async function setUserRoleHandler(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { role } = req.body as { role: string };
  if (role !== 'admin' && role !== 'user') {
    res.status(400).json({ error: 'Role must be admin or user' });
    return;
  }
  const [updated] = await db.update(userProfiles)
    .set({ role })
    .where(eq(userProfiles.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ success: true, role: updated.role });
}

export async function setUserStatusHandler(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { status } = req.body as { status: string };
  if (status !== 'active' && status !== 'pending' && status !== 'suspended') {
    res.status(400).json({ error: 'Status must be active, pending, or suspended' });
    return;
  }
  const [updated] = await db.update(userProfiles)
    .set({ status })
    .where(eq(userProfiles.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ success: true, status: updated.status });
}

export async function listGenerationsHandler(_req: Request, res: Response): Promise<void> {
  const gens = await db.select().from(generations).orderBy(desc(generations.createdAt)).limit(200);
  res.json(gens);
}
