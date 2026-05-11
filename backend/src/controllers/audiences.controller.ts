import { Request, Response } from 'express';
import { z } from 'zod';
import { and, eq, or, desc, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { audiences, userProfiles } from '../db/schema';

const AudienceSchema = z.object({
  name: z.string().min(1),
  demographics: z.string().min(1),
  psychographics: z.string().min(1),
  painPoints: z.string().min(1),
  channels: z.array(z.string()).min(1),
  private: z.boolean().optional().default(false),
});

export async function listAudiences(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const rows = await db
    .select({ audience: audiences, creatorEmail: userProfiles.email })
    .from(audiences)
    .leftJoin(userProfiles, eq(userProfiles.userId, audiences.userId))
    .where(or(eq(audiences.private, false), eq(audiences.userId, userId)))
    .orderBy(sql`${audiences.lastUsedAt} DESC NULLS LAST`, desc(audiences.createdAt));
  res.json(rows.map(r => ({ ...r.audience, creatorEmail: r.creatorEmail ?? null })));
}

export async function createAudience(req: Request, res: Response): Promise<void> {
  const { private: isPrivate, ...rest } = AudienceSchema.parse(req.body);
  const userId = req.user!.userId;
  const [audience] = await db
    .insert(audiences)
    .values({ ...rest, userId, private: isPrivate })
    .returning();
  res.status(201).json(audience);
}

export async function updateAudience(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  const { private: isPrivate, ...rest } = AudienceSchema.parse(req.body);
  const [audience] = await db
    .update(audiences)
    .set({ ...rest, private: isPrivate, updatedAt: new Date() })
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
  await db
    .update(audiences)
    .set({ lastUsedAt: new Date() })
    .where(eq(audiences.id, id as string));
  res.status(204).send();
}
