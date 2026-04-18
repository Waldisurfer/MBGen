import { Request, Response } from 'express';
import { z } from 'zod';
import { generateBannerSuggestions } from '../services/claude.service';
import { checkSpendLimit, recordSpend } from '../utils/spend';
import { CLAUDE_COSTS } from '../config/models';
import { getUserStyleContext } from './styles.controller';

const GRADIENT_IDS = [
  'royal', 'sunset', 'ocean', 'fire', 'forest', 'midnight', 'rose', 'sage',
  'gold', 'carbon', 'aurora', 'deep', 'peach', 'spring', 'wine', 'ice',
];

const SuggestSchema = z.object({
  brandInfo: z.string().min(10, 'Brand info must be at least 10 characters').max(2000),
});

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
