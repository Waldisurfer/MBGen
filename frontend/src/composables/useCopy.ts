import { ref } from 'vue';
import { api } from '@/lib/api';
import { useGenerationStore } from '@/stores/generation.store';
import type { Generation } from '@/types/generation.types';

export function useCopy() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const store = useGenerationStore();

  async function generate(campaignId: string, platform: string): Promise<Generation | null> {
    isLoading.value = true;
    error.value = null;
    try {
      const generation = await api.post<Generation>('/copy/generate', { campaignId, platform });
      store.setGeneration(generation);
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
      store.setGeneration(generation);
      return generation;
    } catch (err) {
      error.value = (err as Error).message;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return { isLoading, error, generate, instruct };
}
