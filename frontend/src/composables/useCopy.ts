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
    isLoading.value = true;
    error.value = null;
    lastCostUsd.value = null;
    try {
      const generation = await api.post<Generation>('/copy/generate', { campaignId, platform });
      lastCostUsd.value = generation.costUsd ?? null;
      store.setGeneration(generation);
      void auth.refreshProfile();
      return generation;
    } catch (err) {
      error.value = (err as Error).message;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function instruct(generationId: string, instruction: string): Promise<Generation | null> {
    isLoading.value = true;
    error.value = null;
    try {
      const generation = await api.post<Generation>('/copy/instruct', { generationId, instruction });
      lastCostUsd.value = generation.costUsd ?? null;
      store.setGeneration(generation);
      void auth.refreshProfile();
      return generation;
    } catch (err) {
      error.value = (err as Error).message;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return { isLoading, error, lastCostUsd, generate, instruct };
}
