import { Request, Response } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { campaigns, generations } from '../db/schema';
import { generateCopy, rewritePrompt } from '../services/claude.service';
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

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  const brief = campaign.brief as StructuredBrief;
  const prompt = `Platform: ${platform}\nBrief: ${JSON.stringify(brief)}`;
  const text = await generateCopy(brief, platform);

  const [generation] = await db
    .insert(generations)
    .values({
      campaignId,
      type: 'copy',
      platform,
      content: { text },
      promptUsed: prompt,
      status: 'completed',
    })
    .returning();

  res.status(201).json(generation);
}

export async function instructCopyHandler(req: Request, res: Response): Promise<void> {
  const { generationId, instruction } = InstructSchema.parse(req.body);

  const [existing] = await db
    .select()
    .from(generations)
    .where(eq(generations.id, generationId))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: 'Generation not found' });
    return;
  }

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, existing.campaignId))
    .limit(1);

  const brief = campaign.brief as StructuredBrief;
  const currentText = (existing.content as { text?: string }).text ?? '';

  const newPrompt = await rewritePrompt(existing.promptUsed, currentText, instruction);
  const text = await generateCopy(brief, existing.platform, instruction);

  const [generation] = await db
    .insert(generations)
    .values({
      campaignId: existing.campaignId,
      type: 'copy',
      platform: existing.platform,
      content: { text },
      promptUsed: newPrompt,
      status: 'completed',
    })
    .returning();

  res.status(201).json(generation);
}
