import { ref } from 'vue';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export interface BannerVariation {
  id: string;
  headline: string;
  subheadline: string;
  cta: string;
  showSub: boolean;
  showCta: boolean;
  gradientId: string;
  fontId: string;
  positionId: string;
}

export type GenerationMode = 'fresh' | 'similar' | 'different';

interface ApiVariation {
  headline: string;
  subheadline: string;
  cta: string;
  showSub: boolean;
  showCta: boolean;
  gradientId: string;
  fontId: string;
  positionId: string;
}

interface GenerateResponse {
  variations: ApiVariation[];
  costUsd: number;
}

function toClientVariation(v: ApiVariation): BannerVariation {
  return { ...v, id: crypto.randomUUID() };
}

function toApiVariation(v: BannerVariation): ApiVariation {
  const { id: _id, ...rest } = v;
  return rest;
}

export function useBannerGeneration() {
  const variations   = ref<BannerVariation[]>([]);
  const isLoading    = ref(false);
  const error        = ref<string | null>(null);
  const lastCostUsd  = ref<number | null>(null);
  const brandInfo    = ref('');
  const count        = ref(6);
  const auth         = useAuthStore();

  async function generate(
    mode: GenerationMode = 'fresh',
    sourceVariation?: BannerVariation,
  ): Promise<void> {
    if (!brandInfo.value.trim()) return;
    isLoading.value = true;
    error.value = null;
    try {
      const body: Record<string, unknown> = {
        brandInfo: brandInfo.value,
        count: count.value,
        mode,
      };
      if (mode !== 'fresh' && sourceVariation) {
        body.sourceVariation = toApiVariation(sourceVariation);
      }
      const result = await api.post<GenerateResponse>('/banner/generate', body);
      variations.value  = result.variations.map(toClientVariation);
      lastCostUsd.value = result.costUsd;
      void auth.refreshProfile();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Generation failed';
    } finally {
      isLoading.value = false;
    }
  }

  async function regenerateOne(
    index: number,
    mode: GenerationMode,
  ): Promise<void> {
    const source = variations.value[index];
    if (!source || !brandInfo.value.trim()) return;
    isLoading.value = true;
    error.value = null;
    try {
      const result = await api.post<GenerateResponse>('/banner/generate', {
        brandInfo: brandInfo.value,
        count: 1,
        mode,
        sourceVariation: toApiVariation(source),
      });
      const newVariation = toClientVariation(result.variations[0]);
      variations.value = variations.value.map((v, i) => i === index ? newVariation : v);
      lastCostUsd.value = (lastCostUsd.value ?? 0) + result.costUsd;
      void auth.refreshProfile();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Regeneration failed';
    } finally {
      isLoading.value = false;
    }
  }

  function updateVariation(id: string, patch: Partial<Omit<BannerVariation, 'id'>>): void {
    variations.value = variations.value.map(v => v.id === id ? { ...v, ...patch } : v);
  }

  function clear(): void {
    variations.value  = [];
    error.value       = null;
    lastCostUsd.value = null;
  }

  return {
    variations,
    isLoading,
    error,
    lastCostUsd,
    brandInfo,
    count,
    generate,
    regenerateOne,
    updateVariation,
    clear,
  };
}
