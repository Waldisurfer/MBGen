import { Request, Response } from 'express';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { campaigns, generations } from '../db/schema';
import { generateCopy, rewritePrompt } from '../services/claude.service';
import { checkSpendLimit, recordSpend } from '../utils/spend';
import { CLAUDE_COSTS } from '../config/models';
import { getUserStyleContext } from './styles.controller';
import type { StructuredBrief } from '../types/api.types';

const GenerateSchema = z.object({
  campaignId: z.string().uuid(),
  platform: z.string().min(1),
});

const InstructSchema = z.object({
  generationId: z.string().uuid(),
  instruction: z.string().min(1),
});

export async function generateCopyHandler(req: Request, res: Response): Promise<void> {
  const { campaignId, platform } = GenerateSchema.parse(req.body);
  const userId = req.user!.userId;
  const cost = CLAUDE_COSTS.copyGenerate;
  await checkSpendLimit(userId, req.user!.role, cost);

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)))
    .limit(1);

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  const brief = campaign.brief as StructuredBrief;
  const prompt = `Platform: ${platform}\nBrief: ${JSON.stringify(brief)}`;
  const styleContext = await getUserStyleContext(userId);
  const text = await generateCopy(brief, platform, undefined, styleContext);
  await recordSpend(userId, cost);

  const [generation] = await db
    .insert(generations)
    .values({
      campaignId,
      type: 'copy',
      platform,
      content: { text },
      promptUsed: prompt,
      status: 'completed',
      userId,
      estimatedCostUsd: cost.toString(),
      actualCostUsd: cost.toString(),
    })
    .returning();

  res.status(201).json({ ...generation, costUsd: cost });
}

export async function instructCopyHandler(req: Request, res: Response): Promise<void> {
  const { generationId, instruction } = InstructSchema.parse(req.body);
  const userId = req.user!.userId;

  const [existing] = await db
    .select()
    .from(generations)
    .where(and(eq(generations.id, generationId), eq(generations.userId, userId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: 'Generation not found' });
    return;
  }

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, existing.campaignId), eq(campaigns.userId, userId)))
    .limit(1);


  const cost = CLAUDE_COSTS.copyGenerate + CLAUDE_COSTS.rewritePrompt;
  await checkSpendLimit(userId, req.user!.role, cost);

  const brief = campaign.brief as StructuredBrief;
  const currentText = (existing.content as { text?: string }).text ?? '';

  const styleContext = await getUserStyleContext(userId);
  const newPrompt = await rewritePrompt(existing.promptUsed, currentText, instruction);
  const text = await generateCopy(brief, existing.platform, instruction, styleContext);
  await recordSpend(userId, cost);

  const [generation] = await db
    .insert(generations)
    .values({
      campaignId: existing.campaignId,
      type: 'copy',
      platform: existing.platform,
      content: { text },
      promptUsed: newPrompt,
      status: 'completed',
      userId,
      estimatedCostUsd: cost.toString(),
      actualCostUsd: cost.toString(),
    })
    .returning();

  res.status(201).json({ ...generation, costUsd: cost });
}
