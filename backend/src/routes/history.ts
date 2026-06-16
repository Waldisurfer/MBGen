import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { and, eq, desc, type SQL } from 'drizzle-orm';
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

const HistoryQuerySchema = z.object({
  type: z.enum(['copy', 'image', 'animation', 'video']).optional(),
  campaignId: z.string().uuid().optional(),
  liked: z.enum(['true', 'false']).optional(),
  sort: z.enum(['recent', 'top']).optional(),
});

const CampaignHistoryQuerySchema = z.object({
  sort: z.enum(['recent', 'top']).optional(),
});

router.get('/', async (req: Request, res: Response) => {
  const query = HistoryQuerySchema.parse(req.query);
  const liked = query.liked === undefined ? undefined : query.liked === 'true';
  const sort = query.sort ?? 'recent';
  const filters: SQL[] = [
    eq(generations.userId, req.user!.userId),
    ...(query.type ? [eq(generations.type, query.type)] : []),
    ...(query.campaignId ? [eq(generations.campaignId, query.campaignId)] : []),
    ...(liked !== undefined ? [eq(generations.liked, liked)] : []),
  ];
  const result = await db
    .select()
    .from(generations)
    .where(and(...filters))
    .orderBy(...(sort === 'top'
      ? [desc(generations.liked), desc(generations.rating), desc(generations.createdAt)]
      : [desc(generations.createdAt)]))
    .limit(100);
  res.json(result);
});

router.get('/favorites', async (req: Request, res: Response) => {
  const query = HistoryQuerySchema.pick({ type: true, campaignId: true }).parse(req.query);
  const filters: SQL[] = [
    eq(generations.userId, req.user!.userId),
    eq(generations.liked, true),
    ...(query.type ? [eq(generations.type, query.type)] : []),
    ...(query.campaignId ? [eq(generations.campaignId, query.campaignId)] : []),
  ];

  const result = await db
    .select()
    .from(generations)
    .where(and(...filters))
    .orderBy(desc(generations.rating), desc(generations.createdAt))
    .limit(100);
  res.json(result);
});

router.get('/lineage/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const chain: Array<typeof generations.$inferSelect> = [];
  let currentId: string | null = req.params.id as string;
  const MAX_DEPTH = 20;

  for (let depth = 0; depth < MAX_DEPTH && currentId; depth++) {
    const [row] = await db
      .select()
      .from(generations)
      .where(and(eq(generations.id, currentId), eq(generations.userId, userId)))
      .limit(1);
    if (!row) break;
    chain.push(row);
    currentId = row.parentGenerationId;
  }

  res.json(chain);
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
  const { sort = 'recent' } = CampaignHistoryQuerySchema.parse(req.query);
  const result = await db
    .select()
    .from(generations)
    .where(and(
      eq(generations.campaignId, req.params.campaignId as string),
      eq(generations.userId, req.user!.userId),
    ))
    .orderBy(...(sort === 'top'
      ? [desc(generations.liked), desc(generations.rating), desc(generations.createdAt)]
      : [desc(generations.createdAt)]))
    .limit(100);
  res.json(result);
});

export default router;
