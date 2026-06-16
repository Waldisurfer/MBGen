<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import CopyGenerator from '@/components/generators/CopyGenerator.vue';
import ImageGenerator from '@/components/generators/ImageGenerator.vue';
import AnimationGenerator from '@/components/generators/AnimationGenerator.vue';
import VideoGenerator from '@/components/generators/VideoGenerator.vue';
import GenerationTimeline from '@/components/generation/GenerationTimeline.vue';
import { useCampaignStore } from '@/stores/campaign.store';
import { useGenerationStore } from '@/stores/generation.store';
import { api } from '@/lib/api';
import type { Generation, GenerationFeedbackPatch } from '@/types/generation.types';
import type { SavedBanner } from '@/composables/useBannerCreate';

const route = useRoute();
const router = useRouter();
const campaignStore = useCampaignStore();
const generationStore = useGenerationStore();
const selectedTimelineId = ref<string | null>(null);
const campaignBanners = ref<SavedBanner[]>([]);

const campaignId = computed(() => route.params.id as string);
const campaign = computed(() => campaignStore.currentCampaign);

// Default to the first channel in audience, fallback to instagram
const platform = computed(() => {
  const channels = campaign.value?.audience?.channels;
  return (channels && channels[0]) ?? 'instagram';
});

const campaignGenerations = computed(() =>
  generationStore.getGenerationsForCampaign(campaignId.value)
);

onMounted(async () => {
  await Promise.all([
    generationStore.fetchHistory(campaignId.value),
    fetchCampaignBanners(),
  ]);
});

function selectGeneration(generation: Generation) {
  selectedTimelineId.value = generation.id;
  generationStore.selectGeneration(generation);
}

async function patchGeneration(
  generation: Generation,
  patch: GenerationFeedbackPatch
) {
  await generationStore.patchGeneration(generation.id, patch);
}

async function fetchCampaignBanners() {
  campaignBanners.value = await api.get<SavedBanner[]>('/banners', { campaignId: campaignId.value });
}

async function toggleBannerLike(banner: SavedBanner) {
  const updated = await api.patch<SavedBanner>(`/banners/${banner.id}`, { liked: !banner.liked });
  const index = campaignBanners.value.findIndex((item) => item.id === banner.id);
  if (index !== -1) campaignBanners.value[index] = updated;
}

function openBannerStudio(parentBannerId?: string) {
  router.push({
    path: '/banner',
    query: {
      campaignId: campaignId.value,
      ...(parentBannerId ? { parentBannerId } : {}),
    },
  });
}
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ campaign?.name ?? 'Generate Content' }}
        </h1>
        <p class="text-sm text-gray-500 mt-0.5">
          All 4 generators run independently. Generate, tweak with the instruct bar below each.
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          variant="secondary"
          @click="router.push(`/campaign/${campaignId}/preview`)"
        >
          Preview All
        </Button>
      </div>
    </div>

    <!-- Brief summary -->
    <div v-if="campaign?.brief" class="mb-6 p-4 bg-brand-50 rounded-xl border border-brand-100">
      <p class="text-sm font-medium text-brand-800 mb-1">Campaign brief</p>
      <p class="text-sm text-brand-700">{{ campaign.brief.coreConcept }}</p>
      <div class="flex flex-wrap gap-1.5 mt-2">
        <span
          v-for="msg in campaign.brief.keyMessages"
          :key="msg"
          class="px-2 py-0.5 bg-white border border-brand-200 rounded-full text-xs text-brand-700"
        >
          {{ msg }}
        </span>
      </div>
    </div>

    <!-- 2x2 generator grid -->
    <div class="grid grid-cols-2 gap-5">
      <Card>
        <CopyGenerator :campaign-id="campaignId" :platform="platform" />
      </Card>

      <Card>
        <ImageGenerator :campaign-id="campaignId" :platform="platform" />
      </Card>

      <Card>
        <AnimationGenerator :campaign-id="campaignId" :platform="platform" />
      </Card>

      <Card>
        <VideoGenerator :campaign-id="campaignId" :platform="platform" />
      </Card>
    </div>

    <div class="mt-8">
      <GenerationTimeline
        :generations="campaignGenerations"
        :selected-id="selectedTimelineId"
        title="Saved campaign timeline"
        empty-text="Generate something above to start the saved timeline."
        @select="selectGeneration"
        @use-base="selectGeneration"
        @patch="patchGeneration"
      />
    </div>

    <div class="mt-8 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-semibold text-gray-800">Campaign banners</h2>
          <p class="text-xs text-gray-400">HTML banners linked to this campaign.</p>
        </div>
        <Button size="sm" variant="secondary" @click="openBannerStudio()">Create campaign banner</Button>
      </div>

      <div v-if="campaignBanners.length === 0" class="rounded-xl border border-dashed border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
        No linked banners yet.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card v-for="banner in campaignBanners" :key="banner.id" padding="sm">
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-2">
              <p class="text-xs text-gray-500 italic truncate">{{ banner.desc }}</p>
              <button
                :class="[
                  'p-1.5 rounded-lg border transition-colors shrink-0',
                  banner.liked ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:text-red-400',
                ]"
                @click="toggleBannerLike(banner)"
              >
                <svg class="w-3.5 h-3.5" :fill="banner.liked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </button>
            </div>
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white" style="height: 180px;">
              <div style="transform: scale(0.3); transform-origin: top left; width: 600px; height: 600px; pointer-events: none;">
                <div v-html="banner.html" />
              </div>
            </div>
            <details class="text-xs">
              <summary class="cursor-pointer text-gray-500 hover:text-gray-700">Prompt</summary>
              <pre class="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-600 max-h-28 overflow-y-auto">{{ banner.promptUsed }}</pre>
            </details>
            <div class="flex items-center gap-2">
              <Button size="sm" variant="secondary" @click="openBannerStudio(banner.id)">Use as base</Button>
              <span v-if="banner.parentBannerId" class="text-xs text-brand-600">iteration</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
