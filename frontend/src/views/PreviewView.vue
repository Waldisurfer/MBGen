<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from '@/components/ui/Button.vue';
import GenerationTimeline from '@/components/generation/GenerationTimeline.vue';
import { useGenerationStore } from '@/stores/generation.store';
import { useCampaignStore } from '@/stores/campaign.store';
import type { Generation, GenerationFeedbackPatch } from '@/types/generation.types';

const route = useRoute();
const router = useRouter();
const genStore = useGenerationStore();
const campaignStore = useCampaignStore();
const selectedId = ref<string | null>(null);

const campaignId = computed(() => route.params.id as string);
const campaign = computed(() => campaignStore.currentCampaign);
const generations = computed(() =>
  genStore.getGenerationsForCampaign(campaignId.value)
);

onMounted(() => genStore.fetchHistory(campaignId.value));

function selectGeneration(generation: Generation) {
  selectedId.value = generation.id;
  genStore.selectGeneration(generation);
}

async function patchGeneration(
  generation: Generation,
  patch: GenerationFeedbackPatch
) {
  await genStore.patchGeneration(generation.id, patch);
}
</script>

<template>
  <div class="p-8 max-w-6xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Preview</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          All generated content for <strong>{{ campaign?.name }}</strong>
        </p>
      </div>
      <Button variant="secondary" @click="router.push(`/campaign/${campaignId}/generate`)">
        Back to Generate
      </Button>
    </div>

    <GenerationTimeline
      :generations="generations"
      :selected-id="selectedId"
      title="Campaign timeline"
      empty-text="No generations yet. Go to Generate to create content."
      @select="selectGeneration"
      @use-base="selectGeneration"
      @patch="patchGeneration"
    />
  </div>
</template>
