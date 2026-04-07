import { Request, Response } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { campaigns, generations } from '../db/schema';
import {
  startVideoGeneration,
  pollVideoOperation,
  startReplicateVideoGeneration,
  getReplicateVideoPrediction,
} from '../services/veo.service';
import { downloadAndUpload, generateKey } from '../services/storage.service';
import { rewritePrompt } from '../services/claude.service';
import {
  VIDEO_MODELS,
  DEFAULT_VIDEO_MODEL_ID,
  getVideoModel,
} from '../config/models';
import type { StructuredBrief } from '../types/api.types';

const GenerateSchema = z.object({
  campaignId: z.string().uuid(),
  platform: z.string().min(1),
  modelId: z.string().optional(),
});

const InstructSchema = z.object({
  generationId: z.string().uuid(),
  instruction: z.string().min(1),
  modelId: z.string().optional(),
});

function buildVideoPrompt(brief: StructuredBrief, platform: string): string {
  return `Create a compelling ${platform} video ad. ${brief.coreConcept}. Visual style: ${brief.visualDirection}. Key message: ${brief.keyMessages[0]}. Tone: ${brief.tonalGuidelines}. Cinematic quality, professional production.`;
}

export async function generateVideoHandler(req: Request, res: Response): Promise<void> {
  const { campaignId, platform, modelId: rawModelId } = GenerateSchema.parse(req.body);
  const modelId = rawModelId ?? DEFAULT_VIDEO_MODEL_ID;
  const modelConfig = getVideoModel(modelId);

  // Guard: Veo 2 requires Google credentials
  if (modelConfig.provider === 'google' && !process.env.GOOGLE_GENAI_API_KEY) {
    res.status(400).json({
      error: 'Veo 2 requires GOOGLE_GENAI_API_KEY to be configured in backend/.env',
    });
    return;
  }

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
  const prompt = buildVideoPrompt(brief, platform);

  let externalJobId: string;

  if (modelConfig.provider === 'google') {
    const { operationName } = await startVideoGeneration(prompt);
    externalJobId = operationName;
  } else {
    const { predictionId } = await startReplicateVideoGeneration(prompt, modelConfig.replicateModel!);
    externalJobId = predictionId;
  }

  const [generation] = await db
    .insert(generations)
    .values({
      campaignId,
      type: 'video',
      platform,
      content: {},
      promptUsed: prompt,
      status: 'processing',
      externalJobId,
      model: modelId,
    })
    .returning();

  res.status(201).json({ generationId: generation.id, operationName: externalJobId });
}

export async function videoStatusSSE(req: Request, res: Response): Promise<void> {
  const generationId = req.params.generationId as string;

  const [generation] = await db
    .select()
    .from(generations)
    .where(eq(generations.id, generationId))
    .limit(1);

  if (!generation || !generation.externalJobId) {
    res.status(404).json({ error: 'Generation not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL ?? '*');
  res.flushHeaders();

  let stopped = false;
  req.on('close', () => { stopped = true; });

  const send = (data: object) => {
    if (!stopped) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const modelId = generation.model ?? DEFAULT_VIDEO_MODEL_ID;
  const modelConfig = getVideoModel(modelId);

  const poll = async () => {
    if (stopped) return;

    try {
      if (modelConfig.provider === 'google') {
        // Veo 2 — Google long-running operations, poll every 15s
        const result = await pollVideoOperation(generation.externalJobId!);
        send(result);

        if (result.status === 'completed' && result.videoUri) {
          try {
            const key = generateKey('videos', generation.id, 'mp4');
            const videoUrl = await downloadAndUpload(result.videoUri, key, { disposition: 'attachment' });
            await db
              .update(generations)
              .set({ content: { videoUrl }, status: 'completed' })
              .where(eq(generations.id, generation.id));
            send({ status: 'completed', videoUrl });
          } catch {
            send({ status: 'failed', error: 'Failed to transfer video to storage' });
          }
          res.end();
          return;
        }

        if (result.status === 'failed') {
          await db
            .update(generations)
            .set({ status: 'failed' })
            .where(eq(generations.id, generation.id));
          res.end();
          return;
        }

        setTimeout(poll, 15_000);
      } else {
        // Replicate video models — poll every 5s (faster turnaround)
        const result = await getReplicateVideoPrediction(generation.externalJobId!);

        if (result.status === 'succeeded' && result.videoUrl) {
          try {
            const key = generateKey('videos', generation.id, 'mp4');
            const videoUrl = await downloadAndUpload(result.videoUrl, key, { disposition: 'attachment' });
            await db
              .update(generations)
              .set({ content: { videoUrl }, status: 'completed' })
              .where(eq(generations.id, generation.id));
            send({ status: 'completed', videoUrl });
          } catch {
            send({ status: 'failed', error: 'Failed to transfer video to storage' });
          }
          res.end();
          return;
        }

        if (result.status === 'failed' || result.status === 'canceled') {
          await db
            .update(generations)
            .set({ status: 'failed' })
            .where(eq(generations.id, generation.id));
          send({ status: 'failed', error: result.error });
          res.end();
          return;
        }

        // Still processing
        send({ status: 'processing' });
        setTimeout(poll, 5_000);
      }
    } catch (err) {
      send({ status: 'failed', error: 'Polling error' });
      res.end();
    }
  };

  poll();
}

export async function instructVideoHandler(req: Request, res: Response): Promise<void> {
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
  const modelId = requestModelId ?? existing.model ?? DEFAULT_VIDEO_MODEL_ID;
  const modelConfig = getVideoModel(modelId);

  if (modelConfig.provider === 'google' && !process.env.GOOGLE_GENAI_API_KEY) {
    res.status(400).json({
      error: 'Veo 2 requires GOOGLE_GENAI_API_KEY to be configured in backend/.env',
    });
    return;
  }

  const currentOutput = (existing.content as { videoUrl?: string }).videoUrl ?? '';
  const newPrompt = await rewritePrompt(existing.promptUsed, currentOutput, instruction);

  let externalJobId: string;

  if (modelConfig.provider === 'google') {
    const { operationName } = await startVideoGeneration(newPrompt);
    externalJobId = operationName;
  } else {
    const { predictionId } = await startReplicateVideoGeneration(newPrompt, modelConfig.replicateModel!);
    externalJobId = predictionId;
  }

  const [generation] = await db
    .insert(generations)
    .values({
      campaignId: existing.campaignId,
      type: 'video',
      platform: existing.platform,
      content: {},
      promptUsed: newPrompt,
      status: 'processing',
      externalJobId,
      model: modelId,
    })
    .returning();

  res.status(201).json({ generationId: generation.id, operationName: externalJobId });
}

export function getVideoModelsHandler(_req: Request, res: Response): void {
  const models = VIDEO_MODELS.map(({ id, displayName, badge, badgeVariant, estimatedSeconds }) => ({
    id,
    displayName,
    badge,
    badgeVariant,
    estimatedSeconds,
  }));
  res.json(models);
}
