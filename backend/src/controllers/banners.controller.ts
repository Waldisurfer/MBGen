import { Request, Response } from 'express';
import { z } from 'zod';
import { and, eq, isNull, desc, type SQL } from 'drizzle-orm';
import { db } from '../db/client';
import { banners } from '../db/schema';

const PatchSchema = z.object({
  liked:      z.boolean().optional(),
  rating:     z.number().int().min(1).max(5).nullable().optional(),
  ctr:        z.number().min(0).max(100).nullable().optional().transform(v => v == null ? v : String(v)),
  notes:      z.string().max(2000).nullable().optional(),
  roundLabel: z.string().max(200).nullable().optional(),
});

export async function listBanners(req: Request, res: Response): Promise<void> {
  const liked = req.query.liked === 'true' ? true : undefined;
  const userId = req.user!.userId;
  const result = await db
    .select()
    .from(banners)
    .where(
      liked !== undefined
        ? and(isNull(banners.deletedAt), eq(banners.liked, liked), eq(banners.userId, userId))
        : and(isNull(banners.deletedAt), eq(banners.userId, userId))
    )
    .orderBy(desc(banners.createdAt));
  res.json(result);
}

export async function updateBanner(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  const patch = PatchSchema.parse(req.body);
  const [updated] = await db
    .update(banners)
    .set(patch)
    .where(and(eq(banners.id, id as string), eq(banners.userId, userId), isNull(banners.deletedAt)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: 'Banner not found' });
    return;
  }
  res.json(updated);
}

export async function deleteBanner(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  const [deleted] = await db
    .update(banners)
    .set({ deletedAt: new Date() })
    .where(and(eq(banners.id, id as string), eq(banners.userId, userId), isNull(banners.deletedAt)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: 'Banner not found' });
    return;
  }
  res.status(204).send();
}

export async function getBannerLineage(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const userId = req.user!.userId;
  const chain: Array<{ id: string; desc: string; liked: boolean; rating: number | null; createdAt: Date }> = [];
  let currentId: string | null = id;
  const MAX_DEPTH = 10;

  for (let depth = 0; depth < MAX_DEPTH && currentId; depth++) {
    const ownerCheck: SQL | undefined = depth === 0
      ? and(eq(banners.id, currentId), eq(banners.userId, userId))
      : eq(banners.id, currentId);
    const [row] = await db
      .select({
        id: banners.id,
        desc: banners.desc,
        liked: banners.liked,
        rating: banners.rating,
        parentBannerId: banners.parentBannerId,
        createdAt: banners.createdAt,
      })
      .from(banners)
      .where(ownerCheck)
      .limit(1);
    if (!row) break;
    chain.push({ id: row.id, desc: row.desc, liked: row.liked, rating: row.rating, createdAt: row.createdAt });
    currentId = (row.parentBannerId as string | null | undefined) ?? null;
  }

  res.json(chain);
}
