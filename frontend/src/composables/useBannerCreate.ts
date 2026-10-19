import { ref } from 'vue';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export interface GeneratedBanner {
  id: string;
  html: string;
  desc: string;
}

interface CreateResponse {
  banners: Array<{ html: string; desc: string }>;
  costUsd: number;
}

export function useBannerCreate() {
  const banners     = ref<GeneratedBanner[]>([]);
  const isLoading   = ref(false);
  const error       = ref<string | null>(null);
  const lastCostUsd = ref<number | null>(null);
  const brandInfo   = ref('');
  const refinement  = ref('');
  const count       = ref(4);
  const auth        = useAuthStore();

  async function create(): Promise<void> {
    if (!brandInfo.value.trim()) return;
    isLoading.value = true;
    error.value = null;
    try {
      const result = await api.post<CreateResponse>('/banner/create', {
        brandInfo: brandInfo.value,
        count: count.value,
        refinement: refinement.value.trim() || undefined,
      }, 120_000); // 2 min — Claude HTML generation can take ~30-60s
      banners.value = result.banners.map(b => ({
        ...b,
        id: crypto.randomUUID(),
      }));
      lastCostUsd.value = result.costUsd;
      void auth.refreshProfile();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Generation failed';
    } finally {
      isLoading.value = false;
    }
  }

  function remove(id: string): void {
    banners.value = banners.value.filter(b => b.id !== id);
  }

  function clear(): void {
    banners.value = [];
    error.value = null;
    lastCostUsd.value = null;
  }

  return {
    banners, isLoading, error, lastCostUsd,
    brandInfo, refinement, count,
    create, remove, clear,
  };
}
