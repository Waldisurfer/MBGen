import { Request, Response } from 'express';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import {
  generateBannerSuggestions,
  generateBannerVariationsFromClaude,
  generateBannerHtml,
  type TopRatedBannerContext,
} from '../services/claude.service';
import { checkSpendLimit, recordSpend } from '../utils/spend';
import { CLAUDE_COSTS } from '../config/models';
import { getUserStyleContext } from './styles.controller';
import { db } from '../db/client';
import { brands, banners, campaigns } from '../db/schema';

async function resolveBrandInfo(_userId: string, brandId: string | undefined, inlineBrandInfo: string): Promise<string> {
  if (!brandId) return inlineBrandInfo;
  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1);
  if (!brand) return inlineBrandInfo;
  await db.update(brands).set({ lastUsedAt: new Date() }).where(eq(brands.id, brandId));
  const parts = [
    `Brand: ${brand.name}`,
    brand.description,
    `Tone: ${brand.tone}`,
  ];
  if (brand.colors.length) parts.push(`Colors: ${brand.colors.join(', ')}`);
  if (brand.fonts.length) parts.push(`Fonts: ${brand.fonts.join(', ')}`);
  return parts.join('\n');
}

const GRADIENT_IDS = [
  'royal', 'sunset', 'ocean', 'fire', 'forest', 'midnight', 'rose', 'sage',
  'gold', 'carbon', 'aurora', 'deep', 'peach', 'spring', 'wine', 'ice',
] as const;

const BannerVariationSpecSchema = z.object({
  headline:    z.string().min(1).max(120),
  subheadline: z.string().max(200),
  cta:         z.string().max(60),
  showSub:     z.boolean(),
  showCta:     z.boolean(),
  gradientId:  z.enum(GRADIENT_IDS),
  fontId:      z.enum(['modern', 'elegant', 'impact', 'minimal', 'luxe', 'dynamic']),
  positionId:  z.enum(['center', 'bottom-left', 'bottom-center', 'top-left']),
});

const SuggestSchema = z.object({
  brandInfo: z.string().max(2000).default(''),
  brandId: z.string().uuid().optional(),
}).refine(d => d.brandId || d.brandInfo.trim().length >= 10, {
  message: 'brandInfo must be at least 10 characters when no brandId is provided',
});

const GenerateSchema = z.object({
  brandInfo:       z.string().max(2000).default(''),
  brandId:         z.string().uuid().optional(),
  count:           z.number().int().refine(v => [2, 4, 6, 8, 10, 12].includes(v), { message: 'count must be 2, 4, 6, 8, 10, or 12' }),
  mode:            z.enum(['fresh', 'similar', 'different']),
  sourceVariation: BannerVariationSpecSchema.optional(),
}).refine(
  (d) => d.mode === 'fresh' || d.sourceVariation !== undefined,
  { message: 'sourceVariation is required for similar/different modes' }
).refine(d => d.brandId || d.brandInfo.trim().length >= 10, {
  message: 'brandInfo must be at least 10 characters when no brandId is provided',
});

export async function suggestBannerContent(req: Request, res: Response): Promise<void> {
  const { brandInfo: inlineBrandInfo, brandId } = SuggestSchema.parse(req.body);
  const userId = req.user!.userId;
  const brandInfo = await resolveBrandInfo(userId, brandId, inlineBrandInfo);
  const cost = CLAUDE_COSTS.bannerSuggest;
  console.log(`[banner] suggestBannerContent userId=${userId} brandInfo="${brandInfo.slice(0, 80)}..." cost=$${cost}`);
  await checkSpendLimit(userId, req.user!.role, cost);
  const styleContext = await getUserStyleContext(userId);
  console.log(`[banner] hasStyleContext=${!!styleContext} — calling Claude`);
  const suggestions = await generateBannerSuggestions(brandInfo, GRADIENT_IDS.join(', '), styleContext);
  console.log(`[banner] Got ${suggestions.headlines.length} headlines, ${suggestions.marketingAngles.length} angles`);
  await recordSpend(userId, cost);
  res.json({ ...suggestions, costUsd: cost });
}

const TopRatedContextSchema = z.object({
  desc:       z.string().max(500),
  promptUsed: z.string().max(2000),
  rating:     z.number().int().min(1).max(5).optional(),
  ctr:        z.number().min(0).max(100).optional(),
});

const CreateSchema = z.object({
  brandInfo:       z.string().max(2000).default(''),
  brandId:         z.string().uuid().optional(),
  campaignId:      z.string().uuid().optional(),
  count:           z.number().int().min(1).max(6),
  refinement:      z.string().max(500).optional(),
  parentBannerId:  z.string().uuid().optional(),
  topRatedContext: z.array(TopRatedContextSchema).max(5).optional(),
}).refine(d => d.brandId || d.brandInfo.trim().length >= 10, {
  message: 'brandInfo must be at least 10 characters when no brandId is provided',
});

export async function createBanners(req: Request, res: Response): Promise<void> {
  const { brandInfo: inlineBrandInfo, brandId, campaignId, count, refinement, parentBannerId, topRatedContext } = CreateSchema.parse(req.body);
  const userId = req.user!.userId;
  const brandInfo = await resolveBrandInfo(userId, brandId, inlineBrandInfo);
  const cost = CLAUDE_COSTS.bannerGenerate;
  console.log(`[banner] createBanners userId=${userId} count=${count} hasRefinement=${!!refinement} parentBannerId=${parentBannerId ?? 'none'}`);
  await checkSpendLimit(userId, req.user!.role, cost);
  if (campaignId) {
    const [campaign] = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)))
      .limit(1);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
  }
  const styleContext = await getUserStyleContext(userId);
  const promptUsed = [
    brandInfo,
    refinement ? `Refinement: ${refinement}` : '',
    parentBannerId ? `Based on banner: ${parentBannerId}` : '',
  ].filter(Boolean).join(' | ');
  const generated = await generateBannerHtml(brandInfo, count, refinement, styleContext, topRatedContext);
  console.log(`[banner] Created ${generated.length} HTML banners`);
  const saved = await db
    .insert(banners)
    .values(generated.map(b => ({
      userId,
      ...(campaignId ? { campaignId } : {}),
      html: b.html,
      desc: b.desc,
      promptUsed,
      ...(parentBannerId ? { parentBannerId } : {}),
    })))
    .returning();
  await recordSpend(userId, cost);
  res.json({ banners: saved, costUsd: cost });
}

export async function generateBannerVariations(req: Request, res: Response): Promise<void> {
  const { brandInfo: inlineBrandInfo, brandId, count, mode, sourceVariation } = GenerateSchema.parse(req.body);
  const userId = req.user!.userId;
  const brandInfo = await resolveBrandInfo(userId, brandId, inlineBrandInfo);
  const cost = CLAUDE_COSTS.bannerGenerate;
  console.log(`[banner] generateBannerVariations userId=${userId} count=${count} mode=${mode} cost=$${cost}`);
  await checkSpendLimit(userId, req.user!.role, cost);
  const styleContext = await getUserStyleContext(userId);
  const variations = await generateBannerVariationsFromClaude(
    brandInfo, count, mode, styleContext, sourceVariation
  );
  console.log(`[banner] Generated ${variations.length} variations`);
  await recordSpend(userId, cost);
  res.json({ variations, costUsd: cost });
}
