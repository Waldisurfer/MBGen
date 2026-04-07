import { ref, onUnmounted } from 'vue';
import { api } from '@/lib/api';
import { useGenerationStore } from '@/stores/generation.store';
import type { Generation } from '@/types/generation.types';

interface VideoStartResponse {
  generationId: string;
  operationName: string;
}

interface VideoSSEEvent {
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}

const ESTIMATED_MS: Record<string, number> = {
  'veo-2':              180_000,
  'wan-2.1-480p':        60_000,
  'minimax-video-01':    90_000,
  'luma-dream-machine':  90_000,
};

function modelEstimatedMs(modelId?: string): number {
  return ESTIMATED_MS[modelId ?? ''] ?? 120_000;
}

export function useVideo() {
  const status = ref<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const videoUrl = ref<string | null>(null);
  const generationId = ref<string | null>(null);
  const progress = ref(0);
  const error = ref<string | null>(null);
  const store = useGenerationStore();

  let eventSource: EventSource | null = null;
  let progressTimer: ReturnType<typeof setInterval> | null = null;

  function cleanup() {
    eventSource?.close();
    eventSource = null;
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  async function generate(
    campaignId: string,
    platform: string,
    modelId?: string
  ): Promise<string | null> {
    cleanup();
    status.value = 'processing';
    error.value = null;
    videoUrl.value = null;
    progress.value = 0;

    try {
      const response = await api.post<VideoStartResponse>('/video/generate', {
        campaignId,
        platform,
        ...(modelId ? { modelId } : {}),
      });

      generationId.value = response.generationId;

      const startTime = Date.now();
      const estimatedMs = modelEstimatedMs(modelId);

      progressTimer = setInterval(() => {
        progress.value = Math.min(90, ((Date.now() - startTime) / estimatedMs) * 100);
      }, 1000);

      eventSource = store.startVideoSSE(
        response.generationId,
        (data: VideoSSEEvent | Partial<Generation>) => {
          const d = data as VideoSSEEvent;
          if (d.status === 'completed' && d.videoUrl) {
            status.value = 'completed';
            videoUrl.value = d.videoUrl;
            progress.value = 100;
            cleanup();
          } else if (d.status === 'failed') {
            status.value = 'failed';
            error.value = d.error ?? 'Video generation failed';
            cleanup();
          }
        }
      );

      return response.generationId;
    } catch (err) {
      status.value = 'failed';
      error.value = (err as Error).message;
      cleanup();
      return null;
    }
  }

  async function instruct(
    genId: string,
    instruction: string,
    modelId?: string
  ): Promise<string | null> {
    cleanup();
    status.value = 'processing';
    error.value = null;
    videoUrl.value = null;
    progress.value = 0;

    try {
      const response = await api.post<VideoStartResponse>('/video/instruct', {
        generationId: genId,
        instruction,
        ...(modelId ? { modelId } : {}),
      });

      generationId.value = response.generationId;

      const startTime = Date.now();
      const estimatedMs = modelEstimatedMs(modelId);

      progressTimer = setInterval(() => {
        progress.value = Math.min(90, ((Date.now() - startTime) / estimatedMs) * 100);
      }, 1000);

      eventSource = store.startVideoSSE(
        response.generationId,
        (data: VideoSSEEvent | Partial<Generation>) => {
          const d = data as VideoSSEEvent;
          if (d.status === 'completed' && d.videoUrl) {
            status.value = 'completed';
            videoUrl.value = d.videoUrl;
            progress.value = 100;
            cleanup();
          } else if (d.status === 'failed') {
            status.value = 'failed';
            error.value = d.error ?? 'Video generation failed';
            cleanup();
          }
        }
      );

      return response.generationId;
    } catch (err) {
      status.value = 'failed';
      error.value = (err as Error).message;
      cleanup();
      return null;
    }
  }

  onUnmounted(cleanup);

  return { status, videoUrl, generationId, progress, error, generate, instruct };
}
