<script setup lang="ts">
import { ref, onMounted } from 'vue';
import html2canvas from 'html2canvas';
import { useBannerCreate } from '@/composables/useBannerCreate';
import type { GeneratedBanner } from '@/composables/useBannerCreate';

const {
  banners, isLoading, error, lastCostUsd,
  brandInfo, refinement, count,
  create, remove,
} = useBannerCreate();

const bannerRefs = ref<Record<string, HTMLElement>>({});
const downloading = ref<string | null>(null);

async function download(banner: GeneratedBanner) {
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

// Preload fonts so html2canvas can render them
onMounted(() => {
  if (document.querySelector('link[data-banner-fonts]')) return;
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
});
</script>

<template>
  <div class="flex h-full min-h-screen">

    <!-- ── Left panel ──────────────────────────────────────────────────────── -->
    <aside class="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col">
      <div class="flex-1 px-5 py-6 space-y-6 overflow-y-auto">

        <div>
          <h1 class="text-sm font-semibold text-gray-900">Banner Studio</h1>
          <p class="text-xs text-gray-400 mt-0.5">Claude generates the HTML and CSS</p>
        </div>

        <!-- Brand info -->
        <section class="space-y-1.5">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Brand / offer</label>
          <textarea
            v-model="brandInfo"
            rows="7"
            placeholder="Describe your brand, product, or offer. The more detail, the better the output.

Example:
Zen Coffee – specialty coffee subscription
Single-origin beans, roasted weekly
Start from $19/month, cancel anytime"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </section>

        <!-- Count -->
        <section class="space-y-1.5">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Variations</label>
          <div class="flex gap-2">
            <button
              v-for="n in [1, 2, 3, 4, 6]" :key="n"
              :class="['flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
                count === n
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300']"
              @click="count = n"
            >{{ n }}</button>
          </div>
        </section>

        <!-- Refinement (shown after first generation) -->
        <section v-if="hasGenerated" class="space-y-1.5">
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
          :disabled="isLoading || !brandInfo.trim()"
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
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs text-gray-500 italic">{{ banner.desc }}</p>
            <div class="flex items-center gap-2">
              <button
                class="text-xs text-gray-400 hover:text-red-500 transition-colors"
                @click="remove(banner.id)"
              >Remove</button>
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

          <!-- Banner preview — 600px rendered, scaled down to ~70% to fit the panel -->
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
</template>
