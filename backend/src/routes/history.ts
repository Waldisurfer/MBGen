import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { generations } from '../db/schema';

const router = Router();

const PatchGenerationSchema = z.object({
  liked:      z.boolean().optional(),
  rating:     z.number().int().min(1).max(5).nullable().optional(),
  ctr:        z.number().min(0).max(100).nullable().optional().transform(v => v == null ? v : String(v)),
  notes:      z.string().max(2000).nullable().optional(),
  roundLabel: z.string().max(200).nullable().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  const result = await db
    .select()
    .from(generations)
    .where(eq(generations.userId, req.user!.userId))
    .orderBy(desc(generations.createdAt))
    .limit(100);
  res.json(result);
});

router.patch('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const patch = PatchGenerationSchema.parse(req.body);
  const [updated] = await db
    .update(generations)
    .set(patch)
    .where(and(eq(generations.id, req.params.id as string), eq(generations.userId, userId)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: 'Generation not found' });
    return;
  }
  res.json(updated);
});

router.get('/:campaignId', async (req: Request, res: Response) => {
  const result = await db
    .select()
    .from(generations)
    .where(and(
      eq(generations.campaignId, req.params.campaignId as string),
      eq(generations.userId, req.user!.userId),
    ))
    .orderBy(desc(generations.createdAt));
  res.json(result);
});

export default router;
