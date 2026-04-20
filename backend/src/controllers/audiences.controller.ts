import { Request, Response } from 'express';
import { z } from 'zod';
import { and, eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { audiences } from '../db/schema';

const AudienceSchema = z.object({
  name: z.string().min(1),
  demographics: z.string().min(1),
  psychographics: z.string().min(1),
  painPoints: z.string().min(1),
  channels: z.array(z.string()).min(1),
});

export async function listAudiences(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const result = await db
    .select()
    .from(audiences)
    .where(eq(audiences.userId, userId))
    .orderBy(sql`last_used_at DESC NULLS LAST`, desc(audiences.createdAt));
  res.json(result);
}

export async function createAudience(req: Request, res: Response): Promise<void> {
  const body = AudienceSchema.parse(req.body);
  const userId = req.user!.userId;
  const [audience] = await db
    .insert(audiences)
    .values({ ...body, userId })
    .returning();
  res.status(201).json(audience);
}

export async function updateAudience(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  const body = AudienceSchema.parse(req.body);
  const [audience] = await db
    .update(audiences)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(audiences.id, id as string), eq(audiences.userId, userId)))
    .returning();
  if (!audience) {
    res.status(404).json({ error: 'Audience not found' });
    return;
  }
  res.json(audience);
}

export async function deleteAudience(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  const deleted = await db
    .delete(audiences)
    .where(and(eq(audiences.id, id as string), eq(audiences.userId, userId)))
    .returning();
  if (!deleted.length) {
    res.status(404).json({ error: 'Audience not found' });
    return;
  }
  res.status(204).send();
}

export async function markAudienceUsed(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  await db
    .update(audiences)
    .set({ lastUsedAt: new Date() })
    .where(and(eq(audiences.id, id as string), eq(audiences.userId, userId)));
  res.status(204).send();
}
