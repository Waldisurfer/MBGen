import Replicate from 'replicate';
import {
  getImageModel,
  DEFAULT_IMAGE_MODEL_ID,
  type AspectRatio,
} from '../config/models';

let _replicate: Replicate | null = null;
function getReplicate(): Replicate {
  if (!_replicate) _replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });
  return _replicate;
}

export interface ImageStartResult {
  predictionId: string;
}

export interface ImageStatusResult {
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  outputUrl?: string;
  error?: string;
}

export async function startImageGeneration(
  prompt: string,
  aspectRatio: AspectRatio = '1:1',
  modelId: string = DEFAULT_IMAGE_MODEL_ID
): Promise<ImageStartResult> {
  const modelConfig = getImageModel(modelId);
  const input = modelConfig.buildInput(prompt, aspectRatio);

  const prediction = await getReplicate().predictions.create({
    model: modelConfig.replicateModel,
    input,
  });

  return { predictionId: prediction.id };
}

export async function getImagePrediction(predictionId: string): Promise<ImageStatusResult> {
  const prediction = await getReplicate().predictions.get(predictionId);

  // Different models return output as string or string[]
  const raw = prediction.output;
  const outputUrl = Array.isArray(raw)
    ? (raw[0] as string | undefined)
    : typeof raw === 'string'
      ? raw
      : undefined;

  return {
    status: prediction.status as ImageStatusResult['status'],
    outputUrl,
    error: prediction.error as string | undefined,
  };
}
