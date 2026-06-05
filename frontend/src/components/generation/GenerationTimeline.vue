<script setup lang="ts">
import { computed } from 'vue';
import GenerationCard from './GenerationCard.vue';
import type { Generation, GenerationFeedbackPatch } from '@/types/generation.types';

const props = defineProps<{
  generations: Generation[];
  selectedId?: string | null;
  title?: string;
  emptyText?: string;
}>();

const emit = defineEmits<{
  select: [generation: Generation];
  useBase: [generation: Generation];
  patch: [generation: Generation, patch: GenerationFeedbackPatch];
}>();

const topGenerations = computed(() =>
  props.generations
    .filter((generation) => generation.liked || generation.rating)
    .sort((a, b) => {
      if (Number(b.liked) !== Number(a.liked)) return Number(b.liked) - Number(a.liked);
      if ((b.rating ?? 0) !== (a.rating ?? 0)) return (b.rating ?? 0) - (a.rating ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
);

const remainingGenerations = computed(() => {
  const topIds = new Set(topGenerations.value.map((generation) => generation.id));
  return props.generations
    .filter((generation) => !topIds.has(generation.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});
</script>

<template>
  <section class="space-y-4">
    <div v-if="title" class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-gray-800">{{ title }}</h2>
      <span v-if="generations.length" class="text-xs text-gray-400">{{ generations.length }} saved</span>
    </div>

    <div v-if="generations.length === 0" class="rounded-xl border border-dashed border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
      {{ emptyText ?? 'Generated outputs will appear here.' }}
    </div>

    <div v-else class="space-y-5">
      <div v-if="topGenerations.length" class="space-y-2">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Liked and top rated</p>
        <div class="grid grid-cols-1 gap-3">
          <GenerationCard
            v-for="generation in topGenerations"
            :key="generation.id"
            :generation="generation"
            :selected="generation.id === selectedId"
            @select="emit('select', $event)"
            @use-base="emit('useBase', $event)"
            @patch="(gen, patch) => emit('patch', gen, patch)"
          />
        </div>
      </div>

      <div class="space-y-2">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Timeline</p>
        <div class="grid grid-cols-1 gap-3">
          <GenerationCard
            v-for="generation in remainingGenerations"
            :key="generation.id"
            :generation="generation"
            :selected="generation.id === selectedId"
            @select="emit('select', $event)"
            @use-base="emit('useBase', $event)"
            @patch="(gen, patch) => emit('patch', gen, patch)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
