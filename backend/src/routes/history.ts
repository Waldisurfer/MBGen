import { Router, Request, Response } from 'express';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { generations } from '../db/schema';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const result = await db
    .select()
    .from(generations)
    .where(eq(generations.userId, req.user!.userId))
    .orderBy(desc(generations.createdAt))
    .limit(100);
  res.json(result);
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
