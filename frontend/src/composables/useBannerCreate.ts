import { ref } from 'vue';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export interface SavedBanner {
  id: string;
  userId: string;
  campaignId: string | null;
  html: string;
  desc: string;
  promptUsed: string;
  liked: boolean;
  deletedAt: string | null;
  parentBannerId: string | null;
  roundLabel: string | null;
  ctr: string | null;
  rating: number | null;
  notes: string | null;
  createdAt: string;
}

// Kept for backwards compat with BannerStudioView template
export type GeneratedBanner = SavedBanner;

interface TopRatedContext {
  desc: string;
  promptUsed: string;
  rating?: number;
  ctr?: number;
}

interface CreateResponse {
  banners: SavedBanner[];
  costUsd: number;
}

export function useBannerCreate() {
  const banners      = ref<SavedBanner[]>([]);
  const savedBanners = ref<SavedBanner[]>([]);
  const isLoading    = ref(false);
  const isSavedLoading = ref(false);
  const error        = ref<string | null>(null);
  const lastCostUsd  = ref<number | null>(null);
  const brandInfo    = ref('');
  const brandId      = ref<string | undefined>(undefined);
  const campaignId   = ref<string | undefined>(undefined);
  const refinement   = ref('');
  const count        = ref(4);
  const parentBannerId = ref<string | undefined>(undefined);
  const auth         = useAuthStore();

  async function fetchSaved(params?: { campaignId?: string; liked?: boolean }): Promise<void> {
    isSavedLoading.value = true;
    try {
      const query: Record<string, string> = {};
      if (params?.campaignId) query.campaignId = params.campaignId;
      if (params?.liked !== undefined) query.liked = String(params.liked);
      savedBanners.value = await api.get<SavedBanner[]>('/banners', query);
    } catch (err: unknown) {
      console.error('[bannerCreate] fetchSaved error:', err instanceof Error ? err.message : String(err));
    } finally {
      isSavedLoading.value = false;
    }
  }

  async function create(): Promise<void> {
    if (!brandId.value && !brandInfo.value.trim()) {
      console.warn('[bannerCreate] create() called but no brand info — aborting');
      return;
    }

    // Build top-rated context from liked saved banners (top 3 by rating/ctr)
    const topRatedContext: TopRatedContext[] = savedBanners.value
      .filter(b => b.liked && (b.rating != null || b.ctr != null))
      .sort((a, b) => {
        const ra = a.rating ?? 0, rb = b.rating ?? 0;
        if (rb !== ra) return rb - ra;
        return parseFloat(b.ctr ?? '0') - parseFloat(a.ctr ?? '0');
      })
      .slice(0, 3)
      .map(b => ({
        desc: b.desc,
        promptUsed: b.promptUsed,
        ...(b.rating != null ? { rating: b.rating } : {}),
        ...(b.ctr != null ? { ctr: parseFloat(b.ctr) } : {}),
      }));

    console.log(`[bannerCreate] create() brandId=${brandId.value ?? 'none'} count=${count.value} refinement=${!!refinement.value.trim()} parentBannerId=${parentBannerId.value ?? 'none'} topRated=${topRatedContext.length}`);
    isLoading.value = true;
    error.value = null;
    try {
      const result = await api.post<CreateResponse>('/banner/create', {
        brandInfo: brandInfo.value,
        brandId: brandId.value,
        campaignId: campaignId.value,
        count: count.value,
        refinement: refinement.value.trim() || undefined,
        parentBannerId: parentBannerId.value,
        topRatedContext: topRatedContext.length ? topRatedContext : undefined,
      }, 120_000);
      console.log(`[bannerCreate] create() success banners=${result.banners.length} cost=$${result.costUsd}`);
      banners.value = result.banners;
      // Add to saved list
      savedBanners.value = [...result.banners, ...savedBanners.value];
      lastCostUsd.value = result.costUsd;
      void auth.refreshProfile();
    } catch (err: unknown) {
      console.error('[bannerCreate] create() error:', err instanceof Error ? err.message : String(err));
      error.value = err instanceof Error ? err.message : 'Generation failed';
    } finally {
      isLoading.value = false;
    }
  }

  async function likeBanner(id: string): Promise<void> {
    const banner = findBanner(id);
    if (!banner) return;
    const newLiked = !banner.liked;
    try {
      await api.patch(`/banners/${id}`, { liked: newLiked });
      banner.liked = newLiked;
    } catch (err: unknown) {
      console.error('[bannerCreate] likeBanner error:', err instanceof Error ? err.message : String(err));
    }
  }

  async function rateBanner(id: string, patch: { rating?: number | null; ctr?: number | null; notes?: string | null; roundLabel?: string | null }): Promise<void> {
    try {
      const updated = await api.patch<SavedBanner>(`/banners/${id}`, patch);
      updateLocalBanner(id, updated);
    } catch (err: unknown) {
      console.error('[bannerCreate] rateBanner error:', err instanceof Error ? err.message : String(err));
    }
  }

  async function remove(id: string): Promise<void> {
    try {
      await api.delete(`/banners/${id}`);
      banners.value = banners.value.filter(b => b.id !== id);
      savedBanners.value = savedBanners.value.filter(b => b.id !== id);
    } catch (err: unknown) {
      console.error('[bannerCreate] remove error:', err instanceof Error ? err.message : String(err));
    }
  }

  function useAsBase(banner: SavedBanner): void {
    parentBannerId.value = banner.id;
    refinement.value = banner.promptUsed.split(' | Refinement: ').pop() ?? '';
  }

  function clearParent(): void {
    parentBannerId.value = undefined;
  }

  function clear(): void {
    banners.value = [];
    error.value = null;
    lastCostUsd.value = null;
    parentBannerId.value = undefined;
  }

  function findBanner(id: string): SavedBanner | undefined {
    return banners.value.find(b => b.id === id) ?? savedBanners.value.find(b => b.id === id);
  }

  function updateLocalBanner(id: string, updated: SavedBanner): void {
    const inGenerated = banners.value.findIndex(b => b.id === id);
    if (inGenerated !== -1) banners.value[inGenerated] = updated;
    const inSaved = savedBanners.value.findIndex(b => b.id === id);
    if (inSaved !== -1) savedBanners.value[inSaved] = updated;
  }

  return {
    banners, savedBanners, isLoading, isSavedLoading, error, lastCostUsd,
    brandInfo, brandId, campaignId, refinement, count, parentBannerId,
    create, remove, clear, likeBanner, rateBanner, useAsBase, clearParent, fetchSaved,
  };
}
