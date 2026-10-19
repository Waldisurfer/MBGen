import { Request, Response } from 'express';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { campaigns, generations } from '../db/schema';
import {
  startImageGeneration,
  getImagePrediction,
} from '../services/image.service';
import { downloadAndUpload, generateKey } from '../services/storage.service';
import { rewritePrompt } from '../services/claude.service';
import { checkSpendLimit, recordSpend } from '../utils/spend';
import { IMAGE_MODELS, DEFAULT_IMAGE_MODEL_ID, CLAUDE_COSTS, type AspectRatio } from '../config/models';
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
  const userId = req.user!.userId;
  console.log(`[images] generateImage campaignId=${campaignId} platform=${platform} modelId=${modelId} userId=${userId}`);

  const modelConfig = IMAGE_MODELS.find(m => m.id === modelId);
  const estimatedCost = modelConfig?.estimatedCostUsd ?? 0.04;
  console.log(`[images] estimatedCost=$${estimatedCost}`);
  await checkSpendLimit(userId, req.user!.role, estimatedCost);

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)))
    .limit(1);

  if (!campaign) {
    console.warn(`[images] Campaign ${campaignId} not found`);
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  const brief = campaign.brief as StructuredBrief;
  const prompt = buildImagePrompt(brief, platform);
  console.log(`[images] Built prompt: "${prompt.slice(0, 100)}..."`);

  console.log(`[images] Starting Replicate prediction with model=${modelId}`);
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
      userId,
      estimatedCostUsd: estimatedCost.toString(),
    })
    .returning();

  console.log(`[images] Created generation id=${generation.id} predictionId=${predictionId}`);
  res.status(201).json({ ...generation, predictionId, estimatedCostUsd: estimatedCost });
}

export async function imageStatusHandler(req: Request, res: Response): Promise<void> {
  const { predictionId } = StatusSchema.parse(req.params);
  const userId = req.user!.userId;
  console.log(`[images] imageStatus predictionId=${predictionId} userId=${userId}`);

  const [generation] = await db
    .select()
    .from(generations)
    .where(and(eq(generations.externalJobId, predictionId), eq(generations.userId, userId)))
    .limit(1);

  const result = await getImagePrediction(predictionId);
  console.log(`[images] Replicate status=${result.status} outputUrl=${result.outputUrl ?? 'none'}`);

  if (result.status === 'succeeded' && result.outputUrl && generation) {
    console.log(`[images] Succeeded — downloading and uploading to R2`);
    const key = generateKey('images', generation.id, 'webp');
    const imageUrl = await downloadAndUpload(result.outputUrl, key);
    const actualCost = parseFloat(generation.estimatedCostUsd ?? '0.04');
    console.log(`[images] Uploaded to R2: ${imageUrl}, actualCost=$${actualCost}`);

    await db
      .update(generations)
      .set({ content: { imageUrl }, status: 'completed', actualCostUsd: actualCost.toString() })
      .where(eq(generations.id, generation.id));

    await recordSpend(userId, actualCost);

    res.json({ status: 'completed', imageUrl, generationId: generation.id, actualCostUsd: actualCost });
    return;
  }

  if (result.status === 'failed' && generation) {
    console.warn(`[images] Prediction ${predictionId} failed: ${result.error}`);
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
  const userId = req.user!.userId;
  console.log(`[images] generatePrompt modelId=${modelId} ar=${ar} userId=${userId} prompt="${prompt.slice(0, 80)}..."`);

  const modelConfig = IMAGE_MODELS.find(m => m.id === modelId);
  const estimatedCost = modelConfig?.estimatedCostUsd ?? 0.04;
  await checkSpendLimit(userId, req.user!.role, estimatedCost);

  const { predictionId } = await startImageGeneration(prompt, ar, modelId);
  console.log(`[images] generatePrompt started predictionId=${predictionId}`);
  res.status(201).json({ predictionId, modelId, estimatedCostUsd: estimatedCost });
}

export async function quickStatusHandler(req: Request, res: Response): Promise<void> {
  const { predictionId } = StatusSchema.parse(req.params);
  console.log(`[images] quickStatus predictionId=${predictionId}`);
  const result = await getImagePrediction(predictionId);
  console.log(`[images] quickStatus status=${result.status}`);

  if (result.status === 'succeeded' && result.outputUrl) {
    // Record spend — use default model cost as estimation for direct prompts
    const userId = req.user?.userId;
    if (userId) {
      const modelConfig = IMAGE_MODELS.find(m => m.id === DEFAULT_IMAGE_MODEL_ID);
      const cost = modelConfig?.estimatedCostUsd ?? 0.04;
      await recordSpend(userId, cost);
    }

    // If R2 is not configured, return the raw Replicate URL (expires in ~1hr — fine for testing)
    const r2Ready = !!(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
    );
    console.log(`[images] quickStatus r2Ready=${r2Ready}`);

    if (r2Ready) {
      const key = generateKey('images/direct', predictionId, 'webp');
      const imageUrl = await downloadAndUpload(result.outputUrl, key);
      console.log(`[images] quickStatus uploaded to R2: ${imageUrl}`);
      res.json({ status: 'completed', imageUrl });
    } else {
      console.log(`[images] quickStatus R2 not ready, returning raw URL`);
      res.json({ status: 'completed', imageUrl: result.outputUrl });
    }
    return;
  }

  res.json({ status: result.status, error: result.error });
}

export async function instructImageHandler(req: Request, res: Response): Promise<void> {
  const { generationId, instruction, modelId: requestModelId } = InstructSchema.parse(req.body);
  const userId = req.user!.userId;
  console.log(`[images] instructImage generationId=${generationId} instruction="${instruction}" userId=${userId}`);

  const [existing] = await db
    .select()
    .from(generations)
    .where(and(eq(generations.id, generationId), eq(generations.userId, userId)))
    .limit(1);

  if (!existing) {
    console.warn(`[images] instructImage — generation ${generationId} not found`);
    res.status(404).json({ error: 'Generation not found' });
    return;
  }

  // Inherit model from existing generation unless overridden
  const modelId = requestModelId ?? existing.model ?? DEFAULT_IMAGE_MODEL_ID;
  console.log(`[images] instructImage using modelId=${modelId}`);

  const currentOutput = (existing.content as { imageUrl?: string }).imageUrl ?? '';
  console.log('[images] Rewriting prompt...');
  const newPrompt = await rewritePrompt(existing.promptUsed, currentOutput, instruction);
  console.log(`[images] New prompt: "${newPrompt.slice(0, 100)}..."`);

  const { predictionId } = await startImageGeneration(newPrompt, '1:1', modelId);
  console.log(`[images] instructImage started predictionId=${predictionId}`);

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
      userId,
    })
    .returning();

  console.log(`[images] instructImage created generation id=${generation.id}`);
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
