<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import html2canvas from 'html2canvas';
import { useBannerCreate } from '@/composables/useBannerCreate';
import type { SavedBanner } from '@/composables/useBannerCreate';
import BrandSelector from '@/components/ui/BrandSelector.vue';
import type { Brand } from '@/types/campaign.types';

const {
  banners, savedBanners, isLoading, isSavedLoading, error, lastCostUsd,
  brandInfo, brandId, campaignId, refinement, count, parentBannerId,
  create, remove, clear, likeBanner, rateBanner, useAsBase, clearParent, fetchSaved,
} = useBannerCreate();

const route = useRoute();
const selectedBrand = ref<Brand | null>(null);
const linkedCampaignId = computed(() => typeof route.query.campaignId === 'string' ? route.query.campaignId : undefined);

watch(selectedBrand, (brand) => {
  if (brand) {
    brandId.value = brand.id;
    brandInfo.value = '';
  } else {
    brandId.value = undefined;
  }
});

const bannerRefs = ref<Record<string, HTMLElement>>({});
const downloading = ref<string | null>(null);

async function download(banner: SavedBanner) {
  const el = bannerRefs.value[banner.id];
  if (!el || downloading.value) return;
  downloading.value = banner.id;
  try {
    await document.fonts.ready;
    const canvas = await html2canvas(el, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });
    const a = document.createElement('a');
    a.download = `banner-${banner.id.slice(0, 8)}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  } finally {
    downloading.value = null;
  }
}

const hasGenerated = ref(false);

async function generate() {
  await create();
  if (banners.value.length > 0) hasGenerated.value = true;
}

// Saved banners panel
const savedPanelOpen = ref(false);
const savedFilter = ref<'all' | 'liked'>('all');
const editingBanner = ref<string | null>(null);
const ratingInputs = ref<Record<string, { rating: number | null; ctr: string; notes: string; roundLabel: string }>>({});

function getOrInitInput(banner: SavedBanner) {
  if (!ratingInputs.value[banner.id]) {
    ratingInputs.value[banner.id] = {
      rating: banner.rating ?? null,
      ctr: banner.ctr ?? '',
      notes: banner.notes ?? '',
      roundLabel: banner.roundLabel ?? '',
    };
  }
  return ratingInputs.value[banner.id];
}

async function saveRating(banner: SavedBanner) {
  const inp = ratingInputs.value[banner.id];
  if (!inp) return;
  const ctrNum = inp.ctr !== '' ? parseFloat(inp.ctr) : null;
  await rateBanner(banner.id, {
    rating: inp.rating,
    ctr: !isNaN(ctrNum as number) ? ctrNum : null,
    notes: inp.notes || null,
    roundLabel: inp.roundLabel || null,
  });
  editingBanner.value = null;
}

const filteredSaved = computed(() =>
  savedFilter.value === 'liked'
    ? savedBanners.value.filter(b => b.liked)
    : savedBanners.value
);

const parentBanner = computed(() =>
  parentBannerId.value ? savedBanners.value.find(b => b.id === parentBannerId.value) : null
);

onMounted(async () => {
  campaignId.value = linkedCampaignId.value;
  parentBannerId.value = typeof route.query.parentBannerId === 'string' ? route.query.parentBannerId : undefined;
  // Preload fonts
  if (!document.querySelector('link[data-banner-fonts]')) {
    const families = [
      'Montserrat:wght@400;600;700;800',
      'Playfair+Display:ital,wght@0,400;0,700;1,400',
      'Oswald:wght@400;600;700',
      'Poppins:wght@400;600;700',
      'Cormorant+Garamond:ital,wght@0,400;0,600;1,400',
      'Raleway:wght@400;700;800',
      'Roboto:wght@400;700',
      'Lato:wght@400;700',
      'Open+Sans:wght@400;600',
    ];
    const link = Object.assign(document.createElement('link'), {
      rel: 'stylesheet',
      href: `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`,
    });
    link.dataset.bannerFonts = '1';
    document.head.appendChild(link);
  }
  await fetchSaved();
  if (savedBanners.value.length > 0) savedPanelOpen.value = true;
});
</script>

<template>
  <div class="flex flex-col h-full min-h-screen">
    <div class="flex flex-1 min-h-0">

      <!-- ── Left panel ──────────────────────────────────────────────────────── -->
      <aside class="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div class="flex-1 px-5 py-6 space-y-6 overflow-y-auto">

          <div>
            <h1 class="text-sm font-semibold text-gray-900">Banner Studio</h1>
            <p class="text-xs text-gray-400 mt-0.5">Claude generates the HTML and CSS</p>
            <p v-if="linkedCampaignId" class="text-xs text-brand-600 mt-1">New banners will be linked to this campaign.</p>
          </div>

          <!-- Brand selector -->
          <section class="space-y-1.5">
            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</label>
            <BrandSelector v-model="selectedBrand" />
            <p v-if="selectedBrand" class="text-xs text-gray-400 truncate">{{ selectedBrand.description }}</p>
          </section>

          <!-- Manual brand info (shown when no brand selected) -->
          <section v-if="!selectedBrand" class="space-y-1.5">
            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Or describe brand / offer</label>
            <textarea
              v-model="brandInfo"
              rows="5"
              placeholder="Describe your brand, product, or offer.

Example:
Zen Coffee – specialty coffee subscription
Single-origin beans, roasted weekly
Start from $19/month"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </section>

          <!-- Count -->
          <section class="space-y-1.5">
            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Variations</label>
            <div class="flex gap-2">
              <button
                v-for="n in [2, 4, 6]" :key="n"
                :class="['flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
                  count === n
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300']"
                @click="count = n"
              >{{ n }}</button>
            </div>
          </section>

          <!-- Base banner indicator -->
          <section v-if="parentBanner" class="space-y-1.5">
            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Based on</label>
            <div class="flex items-start gap-2 bg-brand-50 rounded-lg px-3 py-2">
              <p class="text-xs text-brand-700 flex-1 italic">{{ parentBanner.desc }}</p>
              <button class="text-brand-400 hover:text-brand-600 shrink-0" @click="clearParent" title="Clear">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </section>

          <!-- Refinement -->
          <section v-if="hasGenerated || parentBanner" class="space-y-1.5">
            <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">What to change</label>
            <textarea
              v-model="refinement"
              rows="3"
              placeholder="e.g. Make it more minimal, use darker colors, bigger CTA button..."
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </section>

          <!-- Error -->
          <p v-if="error" class="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 break-words">{{ error }}</p>

        </div>

        <!-- Generate button -->
        <div class="border-t border-gray-200 px-5 py-4">
          <button
            :disabled="isLoading || (!selectedBrand && !brandInfo.trim())"
            class="w-full py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            @click="generate"
          >
            <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ isLoading ? 'Generating…' : hasGenerated ? 'Regenerate' : 'Generate' }}
          </button>
          <p v-if="lastCostUsd" class="text-[10px] text-gray-400 text-center mt-2">
            ~${{ lastCostUsd.toFixed(3) }} per generation
          </p>
        </div>
      </aside>

      <!-- ── Right: results ──────────────────────────────────────────────────── -->
      <main class="flex-1 bg-gray-50 overflow-auto">

        <!-- Error state -->
        <div v-if="error && !isLoading" class="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
          <div class="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <p class="text-base font-semibold text-gray-800">Generation failed</p>
            <p class="text-sm text-red-500 mt-1 max-w-sm">{{ error }}</p>
            <p class="text-xs text-gray-400 mt-3">Check backend logs for details, then try again.</p>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!hasGenerated && !isLoading" class="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
          <div class="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
            <svg class="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <p class="text-base font-semibold text-gray-800">Claude writes your banners</p>
            <p class="text-sm text-gray-400 mt-1 max-w-xs">Describe your brand on the left and hit Generate. Claude creates the HTML and CSS from scratch.</p>
          </div>
        </div>

        <!-- Loading -->
        <div v-else-if="isLoading" class="flex flex-col items-center justify-center h-full gap-3">
          <svg class="w-8 h-8 animate-spin text-brand-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p class="text-sm text-gray-500">Claude is designing your banners…</p>
        </div>

        <!-- Banner grid -->
        <div v-else class="p-6 space-y-8">
          <div
            v-for="banner in banners"
            :key="banner.id"
            class="group relative"
          >
            <!-- Description + actions -->
            <div class="flex items-center justify-between mb-2 gap-3">
              <p class="text-xs text-gray-500 italic truncate flex-1">{{ banner.desc }}</p>
              <div class="flex items-center gap-1.5 shrink-0">
                <!-- Like -->
                <button
                  :class="['p-1.5 rounded-lg border transition-colors text-sm',
                    banner.liked
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'bg-white border-gray-200 text-gray-400 hover:text-red-400']"
                  :title="banner.liked ? 'Unlike' : 'Like'"
                  @click="likeBanner(banner.id)"
                >
                  <svg class="w-3.5 h-3.5" :fill="banner.liked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </button>
                <!-- Use as base -->
                <button
                  class="px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 hover:border-brand-300 hover:text-brand-600 transition-colors"
                  title="Use this as the base for next generation"
                  @click="useAsBase(banner)"
                >Base</button>
                <!-- Remove -->
                <button
                  class="text-xs text-gray-400 hover:text-red-500 transition-colors px-1.5 py-1.5"
                  @click="remove(banner.id)"
                >Remove</button>
                <!-- Download -->
                <button
                  :disabled="downloading === banner.id"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  @click="download(banner)"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  {{ downloading === banner.id ? 'Saving…' : 'Download PNG' }}
                </button>
              </div>
            </div>

            <!-- Banner preview -->
            <div class="overflow-hidden rounded-xl shadow-lg border border-gray-200 bg-white" style="width: 420px; height: 420px;">
              <div style="transform: scale(0.7); transform-origin: top left; width: 600px; height: 600px;">
                <div
                  :ref="(el) => { if (el) bannerRefs[banner.id] = el as HTMLElement }"
                  v-html="banner.html"
                />
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>

    <!-- ── Saved Banners Panel (bottom collapsible) ────────────────────────── -->
    <div class="border-t border-gray-200 bg-white">
      <!-- Toggle header -->
      <button
        class="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
        @click="savedPanelOpen = !savedPanelOpen"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-gray-700">Saved Banners</span>
          <span v-if="savedBanners.length" class="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{{ savedBanners.length }}</span>
          <span v-if="isSavedLoading" class="text-xs text-gray-400">Loading…</span>
        </div>
        <svg
          :class="['w-4 h-4 text-gray-400 transition-transform', savedPanelOpen ? 'rotate-180' : '']"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <!-- Panel content -->
      <div v-if="savedPanelOpen" class="border-t border-gray-100">
        <!-- Filter tabs -->
        <div class="flex gap-1 px-6 py-3 border-b border-gray-100">
          <button
            v-for="f in [{ key: 'all', label: 'All' }, { key: 'liked', label: '❤ Liked' }]"
            :key="f.key"
            :class="['px-3 py-1 text-xs rounded-full border transition-colors',
              savedFilter === f.key
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300']"
            @click="savedFilter = f.key as 'all' | 'liked'"
          >{{ f.label }}</button>
        </div>

        <!-- Empty -->
        <div v-if="!filteredSaved.length" class="py-8 text-center text-sm text-gray-400">
          {{ savedFilter === 'liked' ? 'Like banners to see them here' : 'Generated banners appear here' }}
        </div>

        <!-- Banner cards -->
        <div v-else class="flex gap-4 px-6 py-4 overflow-x-auto">
          <div
            v-for="banner in filteredSaved"
            :key="banner.id"
            class="shrink-0 w-48 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
          >
            <!-- Thumbnail -->
            <div class="relative overflow-hidden bg-white" style="height: 112px;">
              <div style="transform: scale(0.28); transform-origin: top left; width: 600px; height: 600px; pointer-events: none;">
                <div v-html="banner.html" />
              </div>
              <!-- Liked indicator -->
              <div v-if="banner.liked" class="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </div>
              <!-- Rating badge -->
              <div v-if="banner.rating" class="absolute bottom-1.5 left-1.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded px-1.5 py-0.5">
                {{ banner.rating }}/5
              </div>
            </div>

            <!-- Card body -->
            <div class="p-2.5 space-y-2">
              <p class="text-[11px] text-gray-500 leading-tight line-clamp-2">{{ banner.desc }}</p>

              <!-- Parent indicator -->
              <p v-if="banner.parentBannerId" class="text-[10px] text-brand-500">↳ iteration</p>

              <!-- Round label -->
              <p v-if="banner.roundLabel" class="text-[10px] text-gray-400 truncate">{{ banner.roundLabel }}</p>

              <!-- CTR if set -->
              <p v-if="banner.ctr" class="text-[10px] text-green-600 font-medium">CTR {{ parseFloat(banner.ctr).toFixed(2) }}%</p>

              <!-- Actions row -->
              <div class="flex gap-1 flex-wrap">
                <button
                  :class="['flex-1 py-1 text-[11px] rounded-lg border transition-colors',
                    banner.liked
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'bg-white border-gray-200 text-gray-500 hover:text-red-400']"
                  @click="likeBanner(banner.id)"
                >{{ banner.liked ? '♥' : '♡' }}</button>
                <button
                  class="flex-1 py-1 text-[11px] rounded-lg border border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
                  @click="useAsBase(banner)"
                >Base</button>
                <button
                  class="flex-1 py-1 text-[11px] rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-indigo-600 transition-colors"
                  @click="editingBanner = editingBanner === banner.id ? null : banner.id; getOrInitInput(banner)"
                >Rate</button>
                <button
                  class="flex-1 py-1 text-[11px] rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-red-400 transition-colors"
                  @click="remove(banner.id)"
                >✕</button>
              </div>

              <!-- Inline rating form -->
              <div v-if="editingBanner === banner.id" class="space-y-1.5 pt-1 border-t border-gray-100">
                <!-- Stars -->
                <div class="flex gap-0.5">
                  <button
                    v-for="s in [1,2,3,4,5]" :key="s"
                    :class="['text-lg leading-none', (getOrInitInput(banner).rating ?? 0) >= s ? 'text-yellow-400' : 'text-gray-300']"
                    @click="getOrInitInput(banner).rating = getOrInitInput(banner).rating === s ? null : s"
                  >★</button>
                </div>
                <!-- CTR -->
                <input
                  v-model="getOrInitInput(banner).ctr"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="CTR %"
                  class="w-full text-[11px] border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
                <!-- Round -->
                <input
                  v-model="getOrInitInput(banner).roundLabel"
                  type="text"
                  placeholder="Round (e.g. Week 1 Apr)"
                  class="w-full text-[11px] border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
                <!-- Notes -->
                <textarea
                  v-model="getOrInitInput(banner).notes"
                  rows="2"
                  placeholder="Notes…"
                  class="w-full text-[11px] border border-gray-200 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
                <button
                  class="w-full py-1 text-[11px] font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                  @click="saveRating(banner)"
                >Save</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
