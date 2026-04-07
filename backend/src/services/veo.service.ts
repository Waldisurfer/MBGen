import { GoogleGenAI } from '@google/genai';
import Replicate from 'replicate';

let _replicate: Replicate | null = null;
function getReplicate(): Replicate {
  if (!_replicate) _replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });
  return _replicate;
}

let ai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      // For Vertex AI, use vertexai: true with project/location
      // Uncomment below if using Vertex AI service account instead of API key:
      // vertexai: true,
      // project: process.env.GOOGLE_CLOUD_PROJECT,
      // location: process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1',
    });
  }
  return ai;
}

export interface VideoStartResult {
  operationName: string;
}

export interface VideoStatusResult {
  status: 'processing' | 'completed' | 'failed';
  videoUri?: string;
  error?: string;
}

export async function startVideoGeneration(prompt: string): Promise<VideoStartResult> {
  const client = getClient();

  // @google/genai video generation — API surface may vary by SDK version
  // The operation returns a long-running operation name
  const operation = await (client as unknown as {
    models: {
      generateVideos: (opts: {
        model: string;
        prompt: string;
        config: { durationSeconds: number; aspectRatio: string };
      }) => Promise<{ name?: string }>;
    };
  }).models.generateVideos({
    model: 'veo-2.0-generate-001',
    prompt,
    config: {
      durationSeconds: 8,
      aspectRatio: '16:9',
    },
  });

  const operationName = operation.name;
  if (!operationName) throw new Error('Veo 2 did not return an operation name');

  return { operationName };
}

export interface ReplicateVideoStartResult {
  predictionId: string;
}

export interface ReplicateVideoStatusResult {
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  videoUrl?: string;
  error?: string;
}

export async function startReplicateVideoGeneration(
  prompt: string,
  replicateModel: string
): Promise<ReplicateVideoStartResult> {
  const prediction = await getReplicate().predictions.create({
    model: replicateModel,
    input: { prompt },
  });
  return { predictionId: prediction.id };
}

export async function getReplicateVideoPrediction(
  predictionId: string
): Promise<ReplicateVideoStatusResult> {
  const prediction = await getReplicate().predictions.get(predictionId);

  const raw = prediction.output;
  const videoUrl = typeof raw === 'string'
    ? raw
    : Array.isArray(raw)
      ? (raw[0] as string | undefined)
      : undefined;

  return {
    status: prediction.status as ReplicateVideoStatusResult['status'],
    videoUrl,
    error: prediction.error as string | undefined,
  };
}

export async function pollVideoOperation(operationName: string): Promise<VideoStatusResult> {
  const client = getClient();

  const operation = await (client as unknown as {
    operations: {
      getVideosOperation: (opts: { operation: string }) => Promise<{
        done?: boolean;
        error?: { message?: string };
        response?: { generatedVideos?: Array<{ video?: { uri?: string } }> };
      }>;
    };
  }).operations.getVideosOperation({ operation: operationName });

  if (!operation.done) {
    return { status: 'processing' };
  }

  if (operation.error) {
    return { status: 'failed', error: operation.error.message };
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) {
    return { status: 'failed', error: 'No video URI in response' };
  }

  return { status: 'completed', videoUri };
}
