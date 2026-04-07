<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import CopyGenerator from '@/components/generators/CopyGenerator.vue';
import ImageGenerator from '@/components/generators/ImageGenerator.vue';
import AnimationGenerator from '@/components/generators/AnimationGenerator.vue';
import VideoGenerator from '@/components/generators/VideoGenerator.vue';
import { useCampaignStore } from '@/stores/campaign.store';

const route = useRoute();
const router = useRouter();
const campaignStore = useCampaignStore();

const campaignId = computed(() => route.params.id as string);
const campaign = computed(() => campaignStore.currentCampaign);

// Default to the first channel in audience, fallback to instagram
const platform = computed(() => {
  const channels = campaign.value?.audience?.channels;
  return (channels && channels[0]) ?? 'instagram';
});
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
  </div>
</template>
