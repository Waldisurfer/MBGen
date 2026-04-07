import { ref, onUnmounted } from 'vue';
import { api } from '@/lib/api';
import { useGenerationStore } from '@/stores/generation.store';
import type { Generation } from '@/types/generation.types';

interface ImageStatusResponse {
  status: string;
  imageUrl?: string;
  generationId?: string;
  error?: string;
}

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export function useImages() {
  const status = ref<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const imageUrl = ref<string | null>(null);
  const generationId = ref<string | null>(null);
  const error = ref<string | null>(null);
  const store = useGenerationStore();

  let poller: ReturnType<typeof setInterval> | null = null;

  function stopPolling() {
    if (poller) {
      clearInterval(poller);
      poller = null;
    }
  }

  async function generate(
    campaignId: string,
    platform: string,
    modelId?: string
  ): Promise<string | null> {
    status.value = 'processing';
    error.value = null;
    imageUrl.value = null;

    try {
      const response = await api.post<Generation & { predictionId: string }>(
        '/images/generate',
        { campaignId, platform, ...(modelId ? { modelId } : {}) }
      );

      generationId.value = response.id;
      store.setGeneration(response);

      poller = setInterval(async () => {
        try {
          const statusResponse = await api.get<ImageStatusResponse>(
            `/images/status/${response.predictionId}`
          );

          if (statusResponse.status === 'completed' && statusResponse.imageUrl) {
            status.value = 'completed';
            imageUrl.value = statusResponse.imageUrl;

            if (generationId.value) {
              store.updateGeneration(generationId.value, {
                status: 'completed',
                content: { imageUrl: statusResponse.imageUrl },
              });
            }

            stopPolling();
          } else if (
            statusResponse.status === 'failed' ||
            statusResponse.status === 'canceled'
          ) {
            status.value = 'failed';
            error.value = statusResponse.error ?? 'Image generation failed';
            stopPolling();
          }
        } catch (err) {
          status.value = 'failed';
          error.value = (err as Error).message;
          stopPolling();
        }
      }, 2000);

      return response.id;
    } catch (err) {
      status.value = 'failed';
      error.value = (err as Error).message;
      return null;
    }
  }

  async function instruct(
    genId: string,
    instruction: string,
    modelId?: string
  ): Promise<string | null> {
    stopPolling();
    status.value = 'processing';
    error.value = null;
    imageUrl.value = null;

    try {
      const response = await api.post<Generation & { predictionId: string }>(
        '/images/instruct',
        { generationId: genId, instruction, ...(modelId ? { modelId } : {}) }
      );
      generationId.value = response.id;
      store.setGeneration(response);

      poller = setInterval(async () => {
        const statusResponse = await api.get<ImageStatusResponse>(
          `/images/status/${response.predictionId}`
        );
        if (statusResponse.status === 'completed' && statusResponse.imageUrl) {
          status.value = 'completed';
          imageUrl.value = statusResponse.imageUrl;
          stopPolling();
        } else if (statusResponse.status === 'failed') {
          status.value = 'failed';
          error.value = statusResponse.error ?? 'Failed';
          stopPolling();
        }
      }, 2000);

      return response.id;
    } catch (err) {
      status.value = 'failed';
      error.value = (err as Error).message;
      return null;
    }
  }

  async function generateDirect(
    prompt: string,
    aspectRatio: AspectRatio = '1:1',
    modelId?: string
  ): Promise<void> {
    stopPolling();
    status.value = 'processing';
    error.value = null;
    imageUrl.value = null;

    try {
      const response = await api.post<{ predictionId: string }>(
        '/images/generate-prompt',
        { prompt, aspectRatio, ...(modelId ? { modelId } : {}) }
      );

      poller = setInterval(async () => {
        try {
          const statusResponse = await api.get<{ status: string; imageUrl?: string; error?: string }>(
            `/images/quick-status/${response.predictionId}`
          );

          if (statusResponse.status === 'completed' && statusResponse.imageUrl) {
            status.value = 'completed';
            imageUrl.value = statusResponse.imageUrl;
            stopPolling();
          } else if (statusResponse.status === 'failed' || statusResponse.status === 'canceled') {
            status.value = 'failed';
            error.value = statusResponse.error ?? 'Image generation failed';
            stopPolling();
          }
        } catch (err) {
          status.value = 'failed';
          error.value = (err as Error).message;
          stopPolling();
        }
      }, 2000);
    } catch (err) {
      status.value = 'failed';
      error.value = (err as Error).message;
    }
  }

  onUnmounted(stopPolling);

  return { status, imageUrl, generationId, error, generate, instruct, generateDirect };
}
