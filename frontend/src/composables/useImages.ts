import { ref, onUnmounted } from 'vue';
import { api } from '@/lib/api';
import { useGenerationStore } from '@/stores/generation.store';
import { useAuthStore } from '@/stores/auth.store';
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
  const estimatedCostUsd = ref<number | null>(null);
  const store = useGenerationStore();
  const auth = useAuthStore();

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
    console.log(`[useImages] generate campaignId=${campaignId} platform=${platform} modelId=${modelId}`);
    status.value = 'processing';
    error.value = null;
    imageUrl.value = null;

    try {
      const response = await api.post<Generation & { predictionId: string; estimatedCostUsd?: number }>(
        '/images/generate',
        { campaignId, platform, ...(modelId ? { modelId } : {}) }
      );

      generationId.value = response.id;
      estimatedCostUsd.value = response.estimatedCostUsd ?? null;
      store.setGeneration(response);
      console.log(`[useImages] generate started id=${response.id} predictionId=${response.predictionId} estimatedCost=$${response.estimatedCostUsd}`);

      poller = setInterval(async () => {
        try {
          const statusResponse = await api.get<ImageStatusResponse>(
            `/images/status/${response.predictionId}`
          );
          console.log(`[useImages] poll status=${statusResponse.status} imageUrl=${statusResponse.imageUrl ?? 'none'}`);

          if (statusResponse.status === 'completed' && statusResponse.imageUrl) {
            status.value = 'completed';
            imageUrl.value = statusResponse.imageUrl;

            if (generationId.value) {
              store.updateGeneration(generationId.value, {
                status: 'completed',
                content: { imageUrl: statusResponse.imageUrl },
              });
            }

            void auth.refreshProfile();
            stopPolling();
          } else if (
            statusResponse.status === 'failed' ||
            statusResponse.status === 'canceled'
          ) {
            console.warn(`[useImages] generation failed: ${statusResponse.error}`);
            status.value = 'failed';
            error.value = statusResponse.error ?? 'Image generation failed';
            stopPolling();
          }
        } catch (err) {
          console.error('[useImages] poll error:', (err as Error).message);
          status.value = 'failed';
          error.value = (err as Error).message;
          stopPolling();
        }
      }, 2000);

      return response.id;
    } catch (err) {
      console.error('[useImages] generate error:', (err as Error).message);
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
    console.log(`[useImages] instruct genId=${genId} instruction="${instruction}" modelId=${modelId}`);
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
      console.log(`[useImages] instruct started id=${response.id} predictionId=${response.predictionId}`);

      poller = setInterval(async () => {
        const statusResponse = await api.get<ImageStatusResponse>(
          `/images/status/${response.predictionId}`
        );
        console.log(`[useImages] instruct poll status=${statusResponse.status}`);
        if (statusResponse.status === 'completed' && statusResponse.imageUrl) {
          status.value = 'completed';
          imageUrl.value = statusResponse.imageUrl;
          stopPolling();
        } else if (statusResponse.status === 'failed') {
          console.warn(`[useImages] instruct failed: ${statusResponse.error}`);
          status.value = 'failed';
          error.value = statusResponse.error ?? 'Failed';
          stopPolling();
        }
      }, 2000);

      return response.id;
    } catch (err) {
      console.error('[useImages] instruct error:', (err as Error).message);
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
    console.log(`[useImages] generateDirect ar=${aspectRatio} modelId=${modelId} prompt="${prompt.slice(0, 80)}"`);
    stopPolling();
    status.value = 'processing';
    error.value = null;
    imageUrl.value = null;

    try {
      const response = await api.post<{ predictionId: string }>(
        '/images/generate-prompt',
        { prompt, aspectRatio, ...(modelId ? { modelId } : {}) }
      );
      console.log(`[useImages] generateDirect predictionId=${response.predictionId}`);

      poller = setInterval(async () => {
        try {
          const statusResponse = await api.get<{ status: string; imageUrl?: string; error?: string }>(
            `/images/quick-status/${response.predictionId}`
          );
          console.log(`[useImages] generateDirect poll status=${statusResponse.status}`);

          if (statusResponse.status === 'completed' && statusResponse.imageUrl) {
            status.value = 'completed';
            imageUrl.value = statusResponse.imageUrl;
            console.log(`[useImages] generateDirect completed imageUrl=${statusResponse.imageUrl}`);
            stopPolling();
          } else if (statusResponse.status === 'failed' || statusResponse.status === 'canceled') {
            console.warn(`[useImages] generateDirect failed: ${statusResponse.error}`);
            status.value = 'failed';
            error.value = statusResponse.error ?? 'Image generation failed';
            stopPolling();
          }
        } catch (err) {
          console.error('[useImages] generateDirect poll error:', (err as Error).message);
          status.value = 'failed';
          error.value = (err as Error).message;
          stopPolling();
        }
      }, 2000);
    } catch (err) {
      console.error('[useImages] generateDirect error:', (err as Error).message);
      status.value = 'failed';
      error.value = (err as Error).message;
    }
  }

  onUnmounted(stopPolling);

  return { status, imageUrl, generationId, error, estimatedCostUsd, generate, instruct, generateDirect };
}
