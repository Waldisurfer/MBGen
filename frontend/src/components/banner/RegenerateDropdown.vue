<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { GenerationMode } from '@/composables/useBannerGeneration';

defineProps<{ loading?: boolean }>();

const emit = defineEmits<{
  regenerate: [mode: GenerationMode];
}>();

const open    = ref(false);
const rootRef = ref<HTMLElement | null>(null);

function choose(mode: GenerationMode) {
  open.value = false;
  emit('regenerate', mode);
}

function onDocClick(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener('click', onDocClick));
onUnmounted(() => document.removeEventListener('click', onDocClick));
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      :disabled="loading"
      class="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white/90 hover:bg-white rounded-lg shadow transition-colors disabled:opacity-50"
      @click.stop="open = !open"
    >
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Regen
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30"
    >
      <button
        class="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
        @click="choose('fresh')"
      >
        <span class="font-medium text-gray-800">Fresh</span>
        <span class="block text-gray-400">Completely new direction</span>
      </button>
      <button
        class="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
        @click="choose('similar')"
      >
        <span class="font-medium text-gray-800">Similar style</span>
        <span class="block text-gray-400">Same aesthetic, new copy</span>
      </button>
      <button
        class="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
        @click="choose('different')"
      >
        <span class="font-medium text-gray-800">Different style</span>
        <span class="block text-gray-400">Contrasting look & feel</span>
      </button>
    </div>
  </div>
</template>
