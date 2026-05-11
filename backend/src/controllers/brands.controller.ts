import { Request, Response } from 'express';
import { z } from 'zod';
import { and, eq, or, desc, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { brands, userProfiles } from '../db/schema';

const BrandSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  tone: z.string().min(1),
  colors: z.array(z.string()),
  fonts: z.array(z.string()),
  logoKey: z.string().optional(),
  private: z.boolean().optional().default(false),
});

export async function listBrands(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const rows = await db
    .select({ brand: brands, creatorEmail: userProfiles.email })
    .from(brands)
    .leftJoin(userProfiles, eq(userProfiles.userId, brands.userId))
    .where(or(eq(brands.private, false), eq(brands.userId, userId)))
    .orderBy(sql`${brands.lastUsedAt} DESC NULLS LAST`, desc(brands.createdAt));
  res.json(rows.map(r => ({ ...r.brand, creatorEmail: r.creatorEmail ?? null })));
}

export async function createBrand(req: Request, res: Response): Promise<void> {
  const { private: isPrivate, ...rest } = BrandSchema.parse(req.body);
  const userId = req.user!.userId;
  const [brand] = await db
    .insert(brands)
    .values({ ...rest, userId, private: isPrivate })
    .returning();
  res.status(201).json(brand);
}

export async function updateBrand(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  const { private: isPrivate, ...rest } = BrandSchema.parse(req.body);
  const [brand] = await db
    .update(brands)
    .set({ ...rest, private: isPrivate, updatedAt: new Date() })
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
  await db
    .update(brands)
    .set({ lastUsedAt: new Date() })
    .where(eq(brands.id, id as string));
  res.status(204).send();
}
