import { Request, Response } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { campaigns, generations } from '../db/schema';
import {
  startImageGeneration,
  getImagePrediction,
} from '../services/image.service';
import { downloadAndUpload, generateKey } from '../services/storage.service';
import { rewritePrompt } from '../services/claude.service';
import {
  IMAGE_MODELS,
  DEFAULT_IMAGE_MODEL_ID,
  type AspectRatio,
} from '../config/models';
import type { StructuredBrief } from '../types/api.types';

const GenerateSchema = z.object({
  campaignId: z.string().uuid(),
  platform: z.string().min(1),
  modelId: z.string().optional(),
});

const StatusSchema = z.object({ predictionId: z.string().min(1) });

const GeneratePromptSchema = z.object({
  prompt: z.string().min(1).max(2000),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional(),
  modelId: z.string().optional(),
});

const InstructSchema = z.object({
  generationId: z.string().uuid(),
  instruction: z.string().min(1),
  modelId: z.string().optional(),
});

function buildImagePrompt(brief: StructuredBrief, platform: string): string {
  return `${brief.visualDirection}. ${brief.coreConcept}. Optimized for ${platform} advertising. ${brief.platformAdaptations[platform] ?? ''}. Professional marketing photography style, high quality.`;
}

export async function generateImageHandler(req: Request, res: Response): Promise<void> {
  const { campaignId, platform, modelId: rawModelId } = GenerateSchema.parse(req.body);
  const modelId = rawModelId ?? DEFAULT_IMAGE_MODEL_ID;

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
  const prompt = buildImagePrompt(brief, platform);

  const { predictionId } = await startImageGeneration(prompt, '1:1', modelId);

  const [generation] = await db
    .insert(generations)
    .values({
      campaignId,
      type: 'image',
      platform,
      content: {},
      promptUsed: prompt,
      status: 'processing',
      externalJobId: predictionId,
      model: modelId,
    })
    .returning();

  res.status(201).json({ ...generation, predictionId });
}

export async function imageStatusHandler(req: Request, res: Response): Promise<void> {
  const { predictionId } = StatusSchema.parse(req.params);

  const [generation] = await db
    .select()
    .from(generations)
    .where(eq(generations.externalJobId, predictionId))
    .limit(1);

  const result = await getImagePrediction(predictionId);

  if (result.status === 'succeeded' && result.outputUrl && generation) {
    const key = generateKey('images', generation.id, 'webp');
    const imageUrl = await downloadAndUpload(result.outputUrl, key);

    await db
      .update(generations)
      .set({ content: { imageUrl }, status: 'completed' })
      .where(eq(generations.id, generation.id));

    res.json({ status: 'completed', imageUrl, generationId: generation.id });
    return;
  }

  if (result.status === 'failed' && generation) {
    await db
      .update(generations)
      .set({ status: 'failed' })
      .where(eq(generations.id, generation.id));
  }

  res.json({ status: result.status, error: result.error, generationId: generation?.id });
}

export async function generatePromptHandler(req: Request, res: Response): Promise<void> {
  const { prompt, aspectRatio, modelId: rawModelId } = GeneratePromptSchema.parse(req.body);
  const modelId = rawModelId ?? DEFAULT_IMAGE_MODEL_ID;
  const ar = (aspectRatio ?? '1:1') as AspectRatio;

  const { predictionId } = await startImageGeneration(prompt, ar, modelId);
  res.status(201).json({ predictionId, modelId });
}

export async function quickStatusHandler(req: Request, res: Response): Promise<void> {
  const { predictionId } = StatusSchema.parse(req.params);
  const result = await getImagePrediction(predictionId);

  if (result.status === 'succeeded' && result.outputUrl) {
    // If R2 is not configured, return the raw Replicate URL (expires in ~1hr — fine for testing)
    const r2Ready = !!(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
    );

    if (r2Ready) {
      const key = generateKey('images/direct', predictionId, 'webp');
      const imageUrl = await downloadAndUpload(result.outputUrl, key);
      res.json({ status: 'completed', imageUrl });
    } else {
      res.json({ status: 'completed', imageUrl: result.outputUrl });
    }
    return;
  }

  res.json({ status: result.status, error: result.error });
}

export async function instructImageHandler(req: Request, res: Response): Promise<void> {
  const { generationId, instruction, modelId: requestModelId } = InstructSchema.parse(req.body);

  const [existing] = await db
    .select()
    .from(generations)
    .where(eq(generations.id, generationId))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: 'Generation not found' });
    return;
  }

  // Inherit model from existing generation unless overridden
  const modelId = requestModelId ?? existing.model ?? DEFAULT_IMAGE_MODEL_ID;

  const currentOutput = (existing.content as { imageUrl?: string }).imageUrl ?? '';
  const newPrompt = await rewritePrompt(existing.promptUsed, currentOutput, instruction);

  const { predictionId } = await startImageGeneration(newPrompt, '1:1', modelId);

  const [generation] = await db
    .insert(generations)
    .values({
      campaignId: existing.campaignId,
      type: 'image',
      platform: existing.platform,
      content: {},
      promptUsed: newPrompt,
      status: 'processing',
      externalJobId: predictionId,
      model: modelId,
    })
    .returning();

  res.status(201).json({ ...generation, predictionId });
}

export function getImageModelsHandler(_req: Request, res: Response): void {
  const models = IMAGE_MODELS.map(({ id, displayName, badge, badgeVariant, estimatedSeconds }) => ({
    id,
    displayName,
    badge,
    badgeVariant,
    estimatedSeconds,
  }));
  res.json(models);
}
