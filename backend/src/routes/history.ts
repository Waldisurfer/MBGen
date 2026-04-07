import { Router, Request, Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { generations } from '../db/schema';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const result = await db
    .select()
    .from(generations)
    .orderBy(desc(generations.createdAt))
    .limit(100);
  res.json(result);
});

router.get('/:campaignId', async (req: Request, res: Response) => {
  const result = await db
    .select()
    .from(generations)
    .where(eq(generations.campaignId, req.params.campaignId as string))
    .orderBy(desc(generations.createdAt));
  res.json(result);
});

export default router;
