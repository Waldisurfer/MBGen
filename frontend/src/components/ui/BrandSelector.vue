<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useBrandStore } from '@/stores/brand.store';
import type { Brand } from '@/types/campaign.types';

const props = defineProps<{
  modelValue: Brand | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Brand | null];
}>();

const brandStore = useBrandStore();
const open = ref(false);

onMounted(async () => {
  if (!brandStore.brands.length) {
    await brandStore.fetchBrands();
  }
  // Auto-select latest if nothing selected yet
  if (!props.modelValue && brandStore.latestBrand) {
    emit('update:modelValue', brandStore.latestBrand);
  }
});

// Keep auto-suggest in sync when brands load
watch(() => brandStore.latestBrand, (latest) => {
  if (!props.modelValue && latest) {
    emit('update:modelValue', latest);
  }
});

function select(brand: Brand) {
  emit('update:modelValue', brand);
  open.value = false;
}

function clear() {
  emit('update:modelValue', null);
  open.value = false;
}
</script>

<template>
  <div class="relative">
    <!-- Trigger -->
    <button
      type="button"
      class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-left hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
      @click="open = !open"
    >
      <span v-if="modelValue" class="flex items-center gap-2 min-w-0">
        <!-- Color swatches -->
        <span class="flex gap-0.5 shrink-0">
          <span
            v-for="color in modelValue.colors.slice(0, 3)"
            :key="color"
            class="w-3 h-3 rounded-full border border-gray-200"
            :style="{ background: color }"
          />
        </span>
        <span class="font-medium text-gray-900 truncate">{{ modelValue.name }}</span>
        <span class="text-gray-400 capitalize shrink-0">· {{ modelValue.tone }}</span>
      </span>
      <span v-else class="text-gray-400">Select a brand…</span>
      <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown -->
    <div
      v-if="open"
      class="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
    >
      <div class="max-h-56 overflow-y-auto">
        <button
          v-if="modelValue"
          type="button"
          class="w-full px-3 py-2 text-left text-xs text-gray-400 hover:bg-gray-50 border-b border-gray-100"
          @click="clear"
        >
          Clear selection
        </button>

        <div v-if="brandStore.isLoading" class="px-3 py-4 text-sm text-gray-400 text-center">
          Loading brands…
        </div>

        <div v-else-if="!brandStore.brands.length" class="px-3 py-4 text-sm text-gray-400 text-center">
          No brands yet.
          <RouterLink to="/brands" class="text-brand-600 hover:underline ml-1" @click="open = false">
            Create one →
          </RouterLink>
        </div>

        <button
          v-for="brand in brandStore.brands"
          :key="brand.id"
          type="button"
          :class="[
            'w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors',
            modelValue?.id === brand.id ? 'bg-brand-50' : '',
          ]"
          @click="select(brand)"
        >
          <span class="flex gap-0.5 shrink-0">
            <span
              v-for="color in brand.colors.slice(0, 3)"
              :key="color"
              class="w-3 h-3 rounded-full border border-gray-200"
              :style="{ background: color }"
            />
          </span>
          <span class="flex-1 min-w-0">
            <span class="font-medium text-gray-900 block truncate">{{ brand.name }}</span>
            <span class="text-xs text-gray-400 capitalize">{{ brand.tone }}</span>
          </span>
          <svg v-if="modelValue?.id === brand.id" class="w-4 h-4 text-brand-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>

      <div class="border-t border-gray-100 px-3 py-2">
        <RouterLink
          to="/brands"
          class="text-xs text-brand-600 hover:underline"
          @click="open = false"
        >
          Manage brands →
        </RouterLink>
      </div>
    </div>

    <!-- Backdrop -->
    <div v-if="open" class="fixed inset-0 z-10" @click="open = false" />
  </div>
</template>
