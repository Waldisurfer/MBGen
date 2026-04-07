import { ref } from 'vue';
import { api } from '@/lib/api';

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

  async function suggest(brandInfo: string): Promise<void> {
    isLoading.value   = true;
    error.value       = null;
    suggestions.value = null;
    try {
      suggestions.value = await api.post<BannerSuggestions>('/banner/suggest', { brandInfo });
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

  return { isLoading, error, suggestions, suggest, clear };
}
