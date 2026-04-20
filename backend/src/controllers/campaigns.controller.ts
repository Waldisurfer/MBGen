import { Request, Response } from 'express';
import { z } from 'zod';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { campaigns, brands, audiences } from '../db/schema';
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
  audience: AudienceSchema.optional(),
  audienceId: z.string().uuid().optional(),
  brand: BrandSchema.optional(),
  brandId: z.string().uuid().optional(),
  inspirationKeys: z.array(z.string()),
}).refine(d => d.audience || d.audienceId, { message: 'audience or audienceId is required' })
  .refine(d => d.brand || d.brandId, { message: 'brand or brandId is required' });

export async function listCampaigns(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  console.log(`[campaigns] listCampaigns for userId=${userId}`);
  const result = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, userId))
    .orderBy(desc(campaigns.createdAt));
  console.log(`[campaigns] Found ${result.length} campaigns`);
  res.json(result);
}

export async function getCampaign(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;
  console.log(`[campaigns] getCampaign id=${id} userId=${userId}`);
  const campaign = await db
    .select()
    .from(campaigns)
    .where(and(
      eq(campaigns.id, id as string),
      eq(campaigns.userId, userId),
    ))
    .limit(1);

  if (!campaign[0]) {
    console.warn(`[campaigns] Campaign ${id} not found for user ${userId}`);
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  console.log(`[campaigns] Found campaign: ${campaign[0].name}`);
  res.json(campaign[0]);
}

export async function createCampaign(req: Request, res: Response): Promise<void> {
  const body = CampaignSchema.parse(req.body);
  const userId = req.user!.userId;
  console.log(`[campaigns] createCampaign name="${body.name}" userId=${userId}`);

  // Resolve audience — from library or inline
  let audienceData: { demographics: string; psychographics: string; painPoints: string; channels: string[] };
  let resolvedAudienceId: string | undefined;

  if (body.audienceId) {
    const [saved] = await db
      .select()
      .from(audiences)
      .where(and(eq(audiences.id, body.audienceId), eq(audiences.userId, userId)))
      .limit(1);
    if (!saved) { res.status(400).json({ error: 'Audience not found' }); return; }
    audienceData = {
      demographics: saved.demographics,
      psychographics: saved.psychographics,
      painPoints: saved.painPoints,
      channels: saved.channels,
    };
    resolvedAudienceId = saved.id;
    await db.update(audiences).set({ lastUsedAt: new Date() }).where(eq(audiences.id, saved.id));
  } else {
    audienceData = body.audience!;
  }

  // Resolve brand — from library or inline
  let brandData: { name: string; tone: string; colors: string[]; fonts: string[]; logoKey?: string };
  let resolvedBrandId: string | undefined;

  if (body.brandId) {
    const [saved] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, body.brandId), eq(brands.userId, userId)))
      .limit(1);
    if (!saved) { res.status(400).json({ error: 'Brand not found' }); return; }
    brandData = {
      name: saved.name,
      tone: saved.tone,
      colors: saved.colors,
      fonts: saved.fonts,
      ...(saved.logoKey ? { logoKey: saved.logoKey } : {}),
    };
    resolvedBrandId = saved.id;
    await db.update(brands).set({ lastUsedAt: new Date() }).where(eq(brands.id, saved.id));
  } else {
    brandData = body.brand!;
  }

  // Build form data for brief parsing
  const formData: CampaignFormData = {
    name: body.name,
    strategy: body.strategy,
    audience: audienceData,
    brand: brandData,
    inspirationKeys: body.inspirationKeys,
  };

  // Parse structured brief via Claude (synchronous, ~3-5s)
  console.log('[campaigns] Parsing brief via Claude...');
  const brief = await parseCampaignBrief(formData);
  console.log('[campaigns] Brief parsed:', JSON.stringify(brief).slice(0, 200));

  const [campaign] = await db
    .insert(campaigns)
    .values({
      userId,
      name: body.name,
      strategy: body.strategy,
      audience: audienceData,
      brand: brandData,
      brief,
      ...(resolvedBrandId ? { brandId: resolvedBrandId } : {}),
      ...(resolvedAudienceId ? { audienceId: resolvedAudienceId } : {}),
    })
    .returning();

  console.log(`[campaigns] Created campaign id=${campaign.id}`);
  res.status(201).json(campaign);
}

export async function parseStrategy(req: Request, res: Response): Promise<void> {
  const { document } = z
    .object({ document: z.string().min(50, 'Document is too short') })
    .parse(req.body);

  console.log(`[campaigns] parseStrategy document length=${document.length}`);
  const suggestions = await parseStrategyDocument(document);
  console.log(`[campaigns] parseStrategy returned ${suggestions.length} suggestions`);
  res.json({ suggestions });
}

export async function getUploadUrl(req: Request, res: Response): Promise<void> {
  const { filename, contentType } = z
    .object({ filename: z.string().min(1), contentType: z.string().min(1) })
    .parse(req.query);

  console.log(`[campaigns] getUploadUrl filename=${filename} contentType=${contentType}`);
  const ext = filename.split('.').pop() ?? 'bin';
  const key = generateKey('inspirations', `${Date.now()}-${Math.random().toString(36).slice(2)}`, ext);
  const presignedUrl = await getPresignedUploadUrl(key, contentType as string);

  console.log(`[campaigns] Presigned URL generated for key=${key}`);
  res.json({ presignedUrl, key });
}

export async function uploadInspiration(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    console.warn('[campaigns] uploadInspiration — no file provided');
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  console.log(`[campaigns] uploadInspiration file=${req.file.originalname} size=${req.file.size}`);
  const contentType = req.file.mimetype;
  const ext = (req.file.originalname.split('.').pop() ?? 'bin').toLowerCase();
  const key = generateKey('inspirations', `${Date.now()}-${Math.random().toString(36).slice(2)}`, ext);
  const url = await uploadBuffer(req.file.buffer, key, contentType);

  console.log(`[campaigns] Uploaded inspiration key=${key} url=${url}`);
  res.json({ key, url });
}
