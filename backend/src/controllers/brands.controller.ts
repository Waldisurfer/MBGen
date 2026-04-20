import { Request, Response } from 'express';
import { z } from 'zod';
import { and, eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { brands } from '../db/schema';

const BrandSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  tone: z.string().min(1),
  colors: z.array(z.string()),
  fonts: z.array(z.string()),
  logoKey: z.string().optional(),
});

export async function listBrands(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const result = await db
    .select()
    .from(brands)
    .where(eq(brands.userId, userId))
    .orderBy(sql`last_used_at DESC NULLS LAST`, desc(brands.createdAt));
  res.json(result);
}

export async function createBrand(req: Request, res: Response): Promise<void> {
  const body = BrandSchema.parse(req.body);
  const userId = req.user!.userId;
  const [brand] = await db
    .insert(brands)
    .values({ ...body, userId })
    .returning();
  res.status(201).json(brand);
}

export async function updateBrand(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  const body = BrandSchema.parse(req.body);
  const [brand] = await db
    .update(brands)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(brands.id, id as string), eq(brands.userId, userId)))
    .returning();
  if (!brand) {
    res.status(404).json({ error: 'Brand not found' });
    return;
  }
  res.json(brand);
}

export async function deleteBrand(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  const deleted = await db
    .delete(brands)
    .where(and(eq(brands.id, id as string), eq(brands.userId, userId)))
    .returning();
  if (!deleted.length) {
    res.status(404).json({ error: 'Brand not found' });
    return;
  }
  res.status(204).send();
}

export async function markBrandUsed(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  await db
    .update(brands)
    .set({ lastUsedAt: new Date() })
    .where(and(eq(brands.id, id as string), eq(brands.userId, userId)));
  res.status(204).send();
}
