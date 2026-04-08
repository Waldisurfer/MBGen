import { Request, Response } from 'express';
import { z } from 'zod';
import { generateBannerSuggestions } from '../services/claude.service';
import { checkSpendLimit, recordSpend } from '../utils/spend';
import { CLAUDE_COSTS } from '../config/models';

const GRADIENT_IDS = [
  'royal', 'sunset', 'ocean', 'fire', 'forest', 'midnight', 'rose', 'sage',
  'gold', 'carbon', 'aurora', 'deep', 'peach', 'spring', 'wine', 'ice',
];

const SuggestSchema = z.object({
  brandInfo: z.string().min(10, 'Brand info must be at least 10 characters').max(2000),
});

export async function suggestBannerContent(req: Request, res: Response): Promise<void> {
  const { brandInfo } = SuggestSchema.parse(req.body);
  const cost = CLAUDE_COSTS.bannerSuggest;
  await checkSpendLimit(req.user!.userId, req.user!.role, cost);
  const suggestions = await generateBannerSuggestions(brandInfo, GRADIENT_IDS.join(', '));
  await recordSpend(req.user!.userId, cost);
  res.json({ ...suggestions, costUsd: cost });
}
