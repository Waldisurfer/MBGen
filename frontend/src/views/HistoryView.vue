<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import GenerationTimeline from '@/components/generation/GenerationTimeline.vue';
import { api } from '@/lib/api';
import { useGenerationStore } from '@/stores/generation.store';
import type { Generation, GenerationFeedbackPatch } from '@/types/generation.types';

const generations = ref<Generation[]>([]);
const isLoading = ref(false);
const search = ref('');
const selectedId = ref<string | null>(null);
const generationStore = useGenerationStore();

onMounted(async () => {
  isLoading.value = true;
  try {
    generations.value = await api.get<Generation[]>('/history');
  } finally {
    isLoading.value = false;
  }
});

const filtered = computed(() => {
  if (!search.value.trim()) return generations.value;
  const q = search.value.toLowerCase();
  return generations.value.filter(
    (g) =>
      g.type.includes(q) ||
      g.platform.includes(q) ||
      g.status.includes(q) ||
      (g.content?.text ?? '').toLowerCase().includes(q)
  );
});

function selectGeneration(generation: Generation) {
  selectedId.value = generation.id;
  generationStore.selectGeneration(generation);
}

async function patchGeneration(
  generation: Generation,
  patch: GenerationFeedbackPatch
) {
  const updated = await generationStore.patchGeneration(generation.id, patch);
  const index = generations.value.findIndex((item) => item.id === generation.id);
  if (index !== -1) generations.value[index] = updated;
}
</script>

<template>
  <div class="p-8 max-w-5xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">History</h1>
        <p class="text-sm text-gray-500 mt-0.5">All past generations across campaigns.</p>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-5">
      <input
        v-model="search"
        type="text"
        placeholder="Search by type, platform, or content..."
        class="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>

    <div v-if="isLoading" class="text-sm text-gray-400">Loading...</div>

    <GenerationTimeline
      v-else
      :generations="filtered"
      :selected-id="selectedId"
      title="All saved outputs"
      empty-text="No generations found."
      @select="selectGeneration"
      @use-base="selectGeneration"
      @patch="patchGeneration"
    />
  </div>
</template>
