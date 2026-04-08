import { ref } from 'vue';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export interface BannerSuggestions {
  headlines: string[];
  subheadlines: string[];
  ctas: string[];
  colorRecommendations: Array<{ gradientId: string; reason: string }>;
  marketingAngles: Array<{ angle: string; headline: string; sub: string; cta: string }>;
}

export function useBannerAI() {
  const isLoading   = ref(false);
  const error       = ref<string | null>(null);
  const suggestions = ref<BannerSuggestions | null>(null);
  const lastCostUsd = ref<number | null>(null);
  const auth = useAuthStore();

  async function suggest(brandInfo: string): Promise<void> {
    isLoading.value   = true;
    error.value       = null;
    suggestions.value = null;
    lastCostUsd.value = null;
    try {
      const result = await api.post<BannerSuggestions & { costUsd?: number }>('/banner/suggest', { brandInfo });
      lastCostUsd.value = result.costUsd ?? null;
      suggestions.value = result;
      void auth.refreshProfile();
    } catch (err) {
      error.value = (err as Error).message;
    } finally {
      isLoading.value = false;
    }
  }

  function clear(): void {
    suggestions.value = null;
    error.value       = null;
  }

  return { isLoading, error, suggestions, lastCostUsd, suggest, clear };
}
