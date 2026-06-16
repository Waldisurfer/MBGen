<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Card from '@/components/ui/Card.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import PlatformBadge from '@/components/preview/PlatformBadge.vue';
import ExportButton from '@/components/preview/ExportButton.vue';
import type { Generation, GenerationFeedbackPatch } from '@/types/generation.types';

const props = defineProps<{
  generation: Generation;
  selected?: boolean;
}>();

const emit = defineEmits<{
  select: [generation: Generation];
  useBase: [generation: Generation];
  patch: [generation: Generation, patch: GenerationFeedbackPatch];
}>();

const isEditing = ref(false);
const rating = ref<number | null>(props.generation.rating ?? null);
const ctr = ref(props.generation.ctr ?? '');
const notes = ref(props.generation.notes ?? '');
const roundLabel = ref(props.generation.roundLabel ?? '');

watch(
  () => props.generation,
  (generation) => {
    rating.value = generation.rating ?? null;
    ctr.value = generation.ctr ?? '';
    notes.value = generation.notes ?? '';
    roundLabel.value = generation.roundLabel ?? '';
  }
);

const createdAt = computed(() => new Date(props.generation.createdAt).toLocaleString());
const actualCost = computed(() => props.generation.actualCostUsd ?? props.generation.estimatedCostUsd ?? null);

function statusVariant(status: Generation['status']) {
  return status === 'completed' ? 'success' : status === 'failed' ? 'danger' : 'warning';
}

function saveFeedback() {
  const ctrNum = ctr.value !== '' ? parseFloat(ctr.value) : null;
  emit('patch', props.generation, {
    rating: rating.value,
    ctr: !Number.isNaN(ctrNum as number) ? ctrNum : null,
    notes: notes.value || null,
    roundLabel: roundLabel.value || null,
  });
  isEditing.value = false;
}
</script>

<template>
  <Card
    padding="sm"
    :shadow="selected"
    :class="selected ? 'ring-2 ring-brand-500 border-brand-200' : ''"
  >
    <div class="space-y-3">
      <div class="flex items-start justify-between gap-3">
        <button class="min-w-0 text-left" @click="emit('select', generation)">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-gray-800 capitalize">{{ generation.type }}</span>
            <PlatformBadge :platform="generation.platform" />
            <Badge :variant="statusVariant(generation.status)" size="sm">{{ generation.status }}</Badge>
            <span v-if="generation.parentGenerationId" class="text-xs text-brand-600">iteration</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ createdAt }}</p>
        </button>

        <div class="flex items-center gap-1.5 shrink-0">
          <button
            :class="[
              'p-1.5 rounded-lg border transition-colors',
              generation.liked ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:text-red-400',
            ]"
            :title="generation.liked ? 'Unlike' : 'Like'"
            @click="emit('patch', generation, { liked: !generation.liked })"
          >
            <svg class="w-3.5 h-3.5" :fill="generation.liked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
          <ExportButton
            :type="generation.type"
            :image-url="generation.content?.imageUrl"
            :video-url="generation.content?.videoUrl"
          />
        </div>
      </div>

      <div class="rounded-lg bg-gray-50 overflow-hidden">
        <pre
          v-if="generation.type === 'copy' && generation.content?.text"
          class="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans p-3 max-h-36 overflow-y-auto"
        >{{ generation.content.text }}</pre>
        <img
          v-else-if="generation.type === 'image' && generation.content?.imageUrl"
          :src="generation.content.imageUrl"
          class="w-full rounded-lg"
          alt="Generated image"
        />
        <video
          v-else-if="generation.type === 'video' && generation.content?.videoUrl"
          :src="generation.content.videoUrl"
          controls
          preload="metadata"
          class="w-full rounded-lg"
        />
        <div
          v-else-if="generation.type === 'animation' && generation.content?.animationConfig"
          class="p-3 text-xs text-gray-500"
        >
          Animation config with {{ generation.content.animationConfig.elements.length }} elements.
        </div>
        <div v-else class="p-6 text-center text-xs text-gray-400">
          {{ generation.status === 'processing' ? 'Generating...' : 'No preview available' }}
        </div>
      </div>

      <details class="text-xs">
        <summary class="cursor-pointer text-gray-500 hover:text-gray-700">Prompt</summary>
        <pre class="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-600 max-h-32 overflow-y-auto">{{ generation.promptUsed }}</pre>
      </details>

      <div class="flex flex-wrap items-center gap-2 text-xs text-gray-400">
        <span v-if="generation.model">Model: {{ generation.model }}</span>
        <span v-if="actualCost">Cost: ${{ parseFloat(actualCost).toFixed(4) }}</span>
        <span v-if="generation.rating">{{ generation.rating }}/5</span>
        <span v-if="generation.ctr">CTR {{ parseFloat(generation.ctr).toFixed(2) }}%</span>
        <span v-if="generation.roundLabel">{{ generation.roundLabel }}</span>
      </div>

      <p v-if="generation.notes" class="text-xs text-gray-500 rounded-lg bg-gray-50 p-2">{{ generation.notes }}</p>

      <div class="flex items-center gap-2">
        <Button size="sm" variant="secondary" @click="emit('useBase', generation)">Use as base</Button>
        <Button size="sm" variant="ghost" @click="isEditing = !isEditing">{{ isEditing ? 'Cancel' : 'Rate' }}</Button>
      </div>

      <div v-if="isEditing" class="grid grid-cols-1 gap-2 border-t border-gray-100 pt-3">
        <div class="flex gap-1">
          <button
            v-for="star in [1, 2, 3, 4, 5]"
            :key="star"
            :class="['text-lg leading-none', (rating ?? 0) >= star ? 'text-yellow-400' : 'text-gray-300']"
            @click="rating = rating === star ? null : star"
          >★</button>
        </div>
        <input v-model="ctr" type="number" step="0.01" min="0" max="100" placeholder="CTR %" class="text-xs border border-gray-200 rounded px-2 py-1" />
        <input v-model="roundLabel" type="text" placeholder="Round label" class="text-xs border border-gray-200 rounded px-2 py-1" />
        <textarea v-model="notes" rows="2" placeholder="Notes" class="text-xs border border-gray-200 rounded px-2 py-1 resize-none" />
        <Button size="sm" @click="saveFeedback">Save feedback</Button>
      </div>
    </div>
  </Card>
</template>
