<script setup lang="ts">
import { ref } from 'vue';
import { useBannerAI } from '@/composables/useBannerAI';

const props = defineProps<{
  brandInfo: string;
}>();

const emit = defineEmits<{
  applyHeadline: [text: string];
  applyAngle: [headline: string, sub: string, cta: string];
  pinGradient: [gradientId: string];
}>();

const open = ref(false);
const { isLoading, error, suggestions, lastCostUsd, suggest, clear } = useBannerAI();

async function run() {
  if (!props.brandInfo.trim()) return;
  open.value = true;
  await suggest(props.brandInfo);
}
</script>

<template>
  <div class="border border-gray-200 rounded-xl overflow-hidden">
    <!-- Header -->
    <button
      class="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      @click="open = !open"
    >
      <span class="flex items-center gap-2">
        <span class="text-base">✦</span>
        AI suggestions
      </span>
      <span class="text-gray-400 text-xs">{{ open ? '▲' : '▼' }}</span>
    </button>

    <div v-if="open" class="border-t border-gray-200 px-4 py-4 space-y-4">
      <button
        :disabled="isLoading || !brandInfo.trim()"
        class="w-full py-2 px-3 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
        @click="run"
      >
        {{ isLoading ? 'Generating ideas…' : 'Generate AI ideas' }}
      </button>

      <p v-if="error" class="text-xs text-red-600">{{ error }}</p>

      <template v-if="suggestions">
        <p v-if="lastCostUsd" class="text-[10px] text-gray-400 text-right">~${{ lastCostUsd.toFixed(3) }}</p>

        <!-- Headlines -->
        <section class="space-y-1">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Headlines</p>
          <button
            v-for="h in suggestions.headlines" :key="h"
            class="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-brand-50 hover:text-brand-700 text-gray-700 transition-colors"
            @click="emit('applyHeadline', h)"
          >{{ h }}</button>
        </section>

        <!-- Color recommendations -->
        <section class="space-y-1">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Suggested colors</p>
          <div
            v-for="cr in suggestions.colorRecommendations" :key="cr.gradientId"
            class="flex items-center gap-2"
          >
            <button
              :title="`Pin ${cr.gradientId}`"
              class="px-2.5 py-1 text-xs bg-gray-100 hover:bg-brand-50 hover:text-brand-700 rounded-lg transition-colors"
              @click="emit('pinGradient', cr.gradientId)"
            >
              Pin {{ cr.gradientId }}
            </button>
            <span class="text-xs text-gray-500 flex-1">{{ cr.reason }}</span>
          </div>
        </section>

        <!-- Marketing angles -->
        <section class="space-y-1">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Marketing angles</p>
          <button
            v-for="ma in suggestions.marketingAngles" :key="ma.angle"
            class="w-full text-left px-3 py-2 rounded-lg border border-gray-100 hover:border-brand-300 hover:bg-brand-50 transition-colors"
            @click="emit('applyAngle', ma.headline, ma.sub, ma.cta)"
          >
            <p class="text-xs font-medium text-gray-800">{{ ma.angle }}</p>
            <p class="text-[11px] text-gray-500 mt-0.5">{{ ma.headline }}</p>
          </button>
        </section>
      </template>
    </div>
  </div>
</template>
