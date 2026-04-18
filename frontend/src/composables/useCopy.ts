import { ref } from 'vue';
import { api } from '@/lib/api';
import { useGenerationStore } from '@/stores/generation.store';
import { useAuthStore } from '@/stores/auth.store';
import type { Generation } from '@/types/generation.types';

export function useCopy() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastCostUsd = ref<number | null>(null);
  const store = useGenerationStore();
  const auth = useAuthStore();

  async function generate(campaignId: string, platform: string): Promise<Generation | null> {
    console.log(`[useCopy] generate campaignId=${campaignId} platform=${platform}`);
    isLoading.value = true;
    error.value = null;
    lastCostUsd.value = null;
    try {
      const generation = await api.post<Generation>('/copy/generate', { campaignId, platform });
      lastCostUsd.value = generation.costUsd ?? null;
      store.setGeneration(generation);
      void auth.refreshProfile();
      console.log(`[useCopy] generate done id=${generation.id} cost=$${generation.costUsd}`);
      return generation;
    } catch (err) {
      console.error('[useCopy] generate error:', (err as Error).message);
      error.value = (err as Error).message;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function instruct(generationId: string, instruction: string): Promise<Generation | null> {
    console.log(`[useCopy] instruct generationId=${generationId} instruction="${instruction}"`);
    isLoading.value = true;
    error.value = null;
    try {
      const generation = await api.post<Generation>('/copy/instruct', { generationId, instruction });
      lastCostUsd.value = generation.costUsd ?? null;
      store.setGeneration(generation);
      void auth.refreshProfile();
      console.log(`[useCopy] instruct done id=${generation.id}`);
      return generation;
    } catch (err) {
      console.error('[useCopy] instruct error:', (err as Error).message);
      error.value = (err as Error).message;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return { isLoading, error, lastCostUsd, generate, instruct };
}
