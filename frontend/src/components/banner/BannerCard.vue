<script setup lang="ts">
import { ref } from 'vue';
import type { BannerVariation, GenerationMode } from '@/composables/useBannerGeneration';
import BannerRenderer from './BannerRenderer.vue';
import RegenerateDropdown from './RegenerateDropdown.vue';
import { exportBannerAsPng } from '@/utils/bannerExport';

const props = defineProps<{
  variation: BannerVariation;
  index: number;
  sizeRatio: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  edit: [id: string];
  regenerate: [index: number, mode: GenerationMode];
}>();

const rendererEl = ref<InstanceType<typeof BannerRenderer> | null>(null);
const hovered    = ref(false);

async function download() {
  const el = (rendererEl.value?.$el as HTMLElement | undefined) ?? null;
  if (!el) return;
  await exportBannerAsPng(el, `banner-${props.index + 1}-${props.variation.gradientId}-${props.variation.fontId}.png`);
}
</script>

<template>
  <div
    class="group relative cursor-pointer select-none"
    :style="{ aspectRatio: sizeRatio }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @click="emit('edit', variation.id)"
  >
    <BannerRenderer ref="rendererEl" :variation="variation" :small="true" />

    <!-- Hover overlay -->
    <Transition name="fade">
      <div
        v-if="hovered"
        class="absolute inset-0 rounded-lg bg-black/30 flex items-end justify-between p-2 gap-1"
        @click.stop
      >
        <!-- Download -->
        <button
          class="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white/90 hover:bg-white rounded-lg shadow transition-colors"
          @click="download"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          PNG
        </button>

        <div class="flex items-center gap-1">
          <!-- Edit -->
          <button
            class="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white/90 hover:bg-white rounded-lg shadow transition-colors"
            @click="emit('edit', variation.id)"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>

          <!-- Regen dropdown -->
          <RegenerateDropdown
            :loading="loading"
            @regenerate="(mode) => emit('regenerate', index, mode)"
          />
        </div>
      </div>
    </Transition>

    <!-- Index badge -->
    <span class="absolute top-1.5 left-1.5 text-[10px] font-bold text-white/70 leading-none select-none">
      #{{ index + 1 }}
    </span>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
