<script setup lang="ts">
import type { BannerVariation } from '@/composables/useBannerGeneration';
import { GRADIENTS, FONT_PAIRS, POSITIONS } from '@/constants/bannerPresets';

const props = defineProps<{
  variation: BannerVariation;
}>();

const emit = defineEmits<{
  'update:variation': [Partial<Omit<BannerVariation, 'id'>>];
}>();

function set(patch: Partial<Omit<BannerVariation, 'id'>>) {
  emit('update:variation', patch);
}
</script>

<template>
  <aside class="w-64 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
    <div class="px-4 py-5 space-y-6">

      <!-- Visibility toggles -->
      <section class="space-y-2">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Visibility</p>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" :checked="variation.showSub" class="accent-brand-600"
            @change="set({ showSub: ($event.target as HTMLInputElement).checked })" />
          <span class="text-sm text-gray-700">Show subheadline</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" :checked="variation.showCta" class="accent-brand-600"
            @change="set({ showCta: ($event.target as HTMLInputElement).checked })" />
          <span class="text-sm text-gray-700">Show CTA button</span>
        </label>
      </section>

      <!-- Gradient picker -->
      <section class="space-y-2">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Color</p>
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="g in GRADIENTS" :key="g.id"
            :title="g.name"
            :style="{ background: g.css }"
            :class="[
              'w-full aspect-square rounded-md border-2 transition-all',
              variation.gradientId === g.id
                ? 'border-brand-600 scale-110 shadow-md'
                : 'border-transparent hover:border-gray-300',
            ]"
            @click="set({ gradientId: g.id })"
          />
        </div>
      </section>

      <!-- Font picker -->
      <section class="space-y-2">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Font</p>
        <div class="space-y-1">
          <button
            v-for="f in FONT_PAIRS" :key="f.id"
            :class="[
              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border',
              variation.fontId === f.id
                ? 'border-brand-600 bg-brand-50 text-brand-700 font-medium'
                : 'border-transparent text-gray-700 hover:bg-gray-100',
            ]"
            :style="{ fontFamily: `'${f.heading}', sans-serif`, fontWeight: f.weight }"
            @click="set({ fontId: f.id })"
          >
            {{ f.name }}
          </button>
        </div>
      </section>

      <!-- Position picker -->
      <section class="space-y-2">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Text position</p>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="p in POSITIONS" :key="p.id"
            :class="[
              'px-2 py-2 text-xs rounded-lg border transition-colors',
              variation.positionId === p.id
                ? 'border-brand-600 bg-brand-50 text-brand-700 font-medium'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50',
            ]"
            @click="set({ positionId: p.id })"
          >
            {{ p.id === 'center' ? 'Center' : p.id === 'bottom-left' ? 'Bottom left' : p.id === 'bottom-center' ? 'Bottom center' : 'Top left' }}
          </button>
        </div>
      </section>

    </div>
  </aside>
</template>
