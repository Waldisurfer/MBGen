<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import type { BannerVariation } from '@/composables/useBannerGeneration';
import { PLATFORMS } from '@/constants/bannerPresets';
import { exportBannerAsPng, exportBannersToZip } from '@/utils/bannerExport';
import BannerRenderer from './BannerRenderer.vue';
import { varBannerStyle, varHeadlineStyle, varSubStyle, varCtaStyle, varPositionClasses } from '@/utils/bannerStyles';

const props = defineProps<{
  variations: BannerVariation[];
}>();

const emit = defineEmits<{ close: [] }>();

const selectedPlatforms = ref<string[]>(['instagram-post', 'facebook']);
const isDownloading     = ref(false);
const progress          = ref(0);

// Hidden render container refs — one per (variation × platform) combo
const hiddenRefs = ref<Record<string, HTMLElement>>({});

const totalFiles = computed(() => props.variations.length * selectedPlatforms.value.length);

function togglePlatform(id: string) {
  const idx = selectedPlatforms.value.indexOf(id);
  if (idx === -1) selectedPlatforms.value.push(id);
  else selectedPlatforms.value.splice(idx, 1);
}

function hiddenKey(varId: string, platformId: string) {
  return `${varId}__${platformId}`;
}

async function download() {
  if (isDownloading.value || selectedPlatforms.value.length === 0) return;
  isDownloading.value = true;
  progress.value = 0;

  await nextTick(); // ensure hidden renderers are mounted

  const pairs: Array<{ el: HTMLElement; filename: string }> = [];
  for (const v of props.variations) {
    for (const platformId of selectedPlatforms.value) {
      const key = hiddenKey(v.id, platformId);
      const el  = hiddenRefs.value[key];
      if (!el) continue;
      const platform = PLATFORMS.find(p => p.id === platformId)!;
      pairs.push({
        el,
        filename: `banner-${v.gradientId}-${v.fontId}-${platform.id}.png`,
      });
    }
  }

  try {
    if (pairs.length > 6) {
      await exportBannersToZip(pairs, 'banners.zip');
    } else {
      for (const { el, filename } of pairs) {
        await exportBannerAsPng(el, filename, 4);
        progress.value += 1;
        await new Promise(r => setTimeout(r, 350));
      }
    }
  } finally {
    isDownloading.value = false;
    progress.value = 0;
  }
}
</script>

<template>
  <!-- Hidden render layer — off-screen, one div per (variation × platform) -->
  <div aria-hidden="true" style="position:fixed;left:-9999px;top:0;pointer-events:none;z-index:-1;">
    <template v-for="v in variations" :key="v.id">
      <template v-for="p in PLATFORMS" :key="p.id">
        <div
          v-if="selectedPlatforms.includes(p.id)"
          :ref="(el) => { if (el) hiddenRefs[hiddenKey(v.id, p.id)] = el as HTMLElement; }"
          :style="[varBannerStyle(v), { width: `${p.px[0]}px`, aspectRatio: p.ratio, position: 'relative', overflow: 'hidden' }]"
        >
          <div :class="varPositionClasses(v)" style="gap: 24px; padding: 64px;">
            <p :style="varHeadlineStyle(v)" style="font-size: 96px;">{{ v.headline }}</p>
            <p v-if="v.showSub && v.subheadline" :style="varSubStyle(v)" style="font-size: 48px;">{{ v.subheadline }}</p>
            <span v-if="v.showCta && v.cta" :style="varCtaStyle(v)" style="font-size: 36px; padding: 20px 48px;">{{ v.cta }}</span>
          </div>
        </div>
      </template>
    </template>
  </div>

  <!-- Modal -->
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 class="text-base font-semibold text-gray-900">Export banners</h2>
        <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="emit('close')">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 space-y-4">
        <p class="text-sm text-gray-600">
          {{ variations.length }} banner{{ variations.length !== 1 ? 's' : '' }} × selected platforms
        </p>

        <div class="grid grid-cols-2 gap-2">
          <label
            v-for="p in PLATFORMS" :key="p.id"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all',
              selectedPlatforms.includes(p.id)
                ? 'border-brand-600 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300',
            ]"
          >
            <input
              type="checkbox"
              :checked="selectedPlatforms.includes(p.id)"
              class="accent-brand-600"
              @change="togglePlatform(p.id)"
            />
            <div>
              <p class="text-sm font-medium text-gray-800">{{ p.name }}</p>
              <p class="text-[11px] text-gray-400">{{ p.px[0] }} × {{ p.px[1] }}</p>
            </div>
          </label>
        </div>

        <p v-if="totalFiles > 0" class="text-xs text-gray-500 text-center">
          {{ totalFiles }} file{{ totalFiles !== 1 ? 's' : '' }} total
          {{ totalFiles > 6 ? '— will be downloaded as ZIP' : '' }}
        </p>
      </div>

      <!-- Footer -->
      <div class="px-6 pb-5 flex items-center justify-end gap-3">
        <button
          class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          @click="emit('close')"
        >Cancel</button>
        <button
          :disabled="isDownloading || selectedPlatforms.length === 0"
          class="px-5 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          @click="download"
        >
          <template v-if="isDownloading">
            Downloading {{ progress }}/{{ totalFiles }}…
          </template>
          <template v-else>
            Download {{ totalFiles > 0 ? totalFiles : '' }} file{{ totalFiles !== 1 ? 's' : '' }}
          </template>
        </button>
      </div>
    </div>
  </div>
</template>
