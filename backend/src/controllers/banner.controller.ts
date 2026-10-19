import { Request, Response } from 'express';
import { z } from 'zod';
import {
  generateBannerSuggestions,
  generateBannerVariationsFromClaude,
  generateBannerHtml,
} from '../services/claude.service';
import { checkSpendLimit, recordSpend } from '../utils/spend';
import { CLAUDE_COSTS } from '../config/models';
import { getUserStyleContext } from './styles.controller';

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
  brandInfo: z.string().min(10, 'Brand info must be at least 10 characters').max(2000),
});

const GenerateSchema = z.object({
  brandInfo:       z.string().min(10).max(2000),
  count:           z.number().int().refine(v => [2, 4, 6, 8, 10, 12].includes(v), { message: 'count must be 2, 4, 6, 8, 10, or 12' }),
  mode:            z.enum(['fresh', 'similar', 'different']),
  sourceVariation: BannerVariationSpecSchema.optional(),
}).refine(
  (d) => d.mode === 'fresh' || d.sourceVariation !== undefined,
  { message: 'sourceVariation is required for similar/different modes' }
);

export async function suggestBannerContent(req: Request, res: Response): Promise<void> {
  const { brandInfo } = SuggestSchema.parse(req.body);
  const userId = req.user!.userId;
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

const CreateSchema = z.object({
  brandInfo:  z.string().min(10).max(2000),
  count:      z.number().int().min(1).max(6),
  refinement: z.string().max(500).optional(),
});

export async function createBanners(req: Request, res: Response): Promise<void> {
  const { brandInfo, count, refinement } = CreateSchema.parse(req.body);
  const userId = req.user!.userId;
  const cost = CLAUDE_COSTS.bannerGenerate;
  console.log(`[banner] createBanners userId=${userId} count=${count} hasRefinement=${!!refinement}`);
  await checkSpendLimit(userId, req.user!.role, cost);
  const styleContext = await getUserStyleContext(userId);
  const banners = await generateBannerHtml(brandInfo, count, refinement, styleContext);
  console.log(`[banner] Created ${banners.length} HTML banners`);
  await recordSpend(userId, cost);
  res.json({ banners, costUsd: cost });
}

export async function generateBannerVariations(req: Request, res: Response): Promise<void> {
  const { brandInfo, count, mode, sourceVariation } = GenerateSchema.parse(req.body);
  const userId = req.user!.userId;
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
