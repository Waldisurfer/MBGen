import { ref } from 'vue';
import { api } from '@/lib/api';
import { useGenerationStore } from '@/stores/generation.store';
import type { Generation, GsapAnimationConfig } from '@/types/generation.types';

export function useAnimations() {
  const isLoading = ref(false);
  const animationConfig = ref<GsapAnimationConfig | null>(null);
  const generationId = ref<string | null>(null);
  const error = ref<string | null>(null);
  const store = useGenerationStore();

  async function generate(campaignId: string, platform: string): Promise<Generation | null> {
    isLoading.value = true;
    error.value = null;
    animationConfig.value = null;

    try {
      const generation = await api.post<Generation>('/animations/generate', {
        campaignId,
        platform,
      });
      store.setGeneration(generation);
      generationId.value = generation.id;
      animationConfig.value = (generation.content as { animationConfig?: GsapAnimationConfig }).animationConfig ?? null;
      return generation;
    } catch (err) {
      error.value = (err as Error).message;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function instruct(genId: string, instruction: string): Promise<Generation | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const generation = await api.post<Generation>('/animations/instruct', {
        generationId: genId,
        instruction,
      });
      store.setGeneration(generation);
      generationId.value = generation.id;
      animationConfig.value = (generation.content as { animationConfig?: GsapAnimationConfig }).animationConfig ?? null;
      return generation;
    } catch (err) {
      error.value = (err as Error).message;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return { isLoading, animationConfig, generationId, error, generate, instruct };
}
