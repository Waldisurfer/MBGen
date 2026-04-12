import { Request, Response } from 'express';
import { z } from 'zod';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { campaigns } from '../db/schema';
import { parseCampaignBrief, parseStrategyDocument } from '../services/claude.service';
import { uploadBuffer, getPresignedUploadUrl, generateKey } from '../services/storage.service';
import type { CampaignFormData } from '../types/api.types';

const AudienceSchema = z.object({
  demographics: z.string().min(1),
  psychographics: z.string().min(1),
  painPoints: z.string().min(1),
  channels: z.array(z.string()).min(1),
});

const BrandSchema = z.object({
  name: z.string().min(1),
  tone: z.string().min(1),
  colors: z.array(z.string()),
  fonts: z.array(z.string()),
  logoKey: z.string().optional(),
});

const CampaignSchema = z.object({
  name: z.string().min(1),
  strategy: z.string().min(10),
  audience: AudienceSchema,
  brand: BrandSchema,
  inspirationKeys: z.array(z.string()),
});

export async function listCampaigns(req: Request, res: Response): Promise<void> {
  const result = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, req.user!.userId))
    .orderBy(desc(campaigns.createdAt));
  res.json(result);
}

export async function getCampaign(req: Request, res: Response): Promise<void> {
  const campaign = await db
    .select()
    .from(campaigns)
    .where(and(
      eq(campaigns.id, req.params.id as string),
      eq(campaigns.userId, req.user!.userId),
    ))
    .limit(1);

  if (!campaign[0]) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  res.json(campaign[0]);
}

export async function createCampaign(req: Request, res: Response): Promise<void> {
  const body = CampaignSchema.parse(req.body) as CampaignFormData;

  // Parse structured brief via Claude (synchronous, ~3-5s)
  const brief = await parseCampaignBrief(body);

  const [campaign] = await db
    .insert(campaigns)
    .values({
      userId: req.user!.userId,
      name: body.name,
      strategy: body.strategy,
      audience: body.audience,
      brand: body.brand,
      brief,
    })
    .returning();

  res.status(201).json(campaign);
}

export async function parseStrategy(req: Request, res: Response): Promise<void> {
  const { document } = z
    .object({ document: z.string().min(50, 'Document is too short') })
    .parse(req.body);

  const suggestions = await parseStrategyDocument(document);
  res.json({ suggestions });
}

export async function getUploadUrl(req: Request, res: Response): Promise<void> {
  const { filename, contentType } = z
    .object({ filename: z.string().min(1), contentType: z.string().min(1) })
    .parse(req.query);

  const ext = filename.split('.').pop() ?? 'bin';
  const key = generateKey('inspirations', `${Date.now()}-${Math.random().toString(36).slice(2)}`, ext);
  const presignedUrl = await getPresignedUploadUrl(key, contentType as string);

  res.json({ presignedUrl, key });
}

export async function uploadInspiration(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  const contentType = req.file.mimetype;
  const ext = (req.file.originalname.split('.').pop() ?? 'bin').toLowerCase();
  const key = generateKey('inspirations', `${Date.now()}-${Math.random().toString(36).slice(2)}`, ext);
  const url = await uploadBuffer(req.file.buffer, key, contentType);

  res.json({ key, url });
}
