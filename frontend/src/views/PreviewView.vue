<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Badge from '@/components/ui/Badge.vue';
import PlatformBadge from '@/components/preview/PlatformBadge.vue';
import ExportButton from '@/components/preview/ExportButton.vue';
import { useGenerationStore } from '@/stores/generation.store';
import { useCampaignStore } from '@/stores/campaign.store';
import type { Generation } from '@/types/generation.types';

const route = useRoute();
const router = useRouter();
const genStore = useGenerationStore();
const campaignStore = useCampaignStore();

const campaignId = computed(() => route.params.id as string);
const campaign = computed(() => campaignStore.currentCampaign);
const generations = computed(() =>
  genStore.getGenerationsForCampaign(campaignId.value)
);

onMounted(() => genStore.fetchHistory(campaignId.value));

function statusVariant(status: Generation['status']) {
  return status === 'completed' ? 'success' : status === 'failed' ? 'danger' : 'warning';
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

    <div v-if="generations.length === 0" class="text-center py-20 text-gray-400">
      No generations yet. Go to Generate to create content.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <Card
        v-for="gen in generations"
        :key="gen.id"
        padding="sm"
      >
        <!-- Card header -->
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-gray-700 capitalize">{{ gen.type }}</span>
              <PlatformBadge :platform="gen.platform" />
            </div>
            <div class="flex items-center gap-1.5">
              <Badge :variant="statusVariant(gen.status)" size="sm">
                {{ gen.status }}
              </Badge>
              <ExportButton
                :type="gen.type"
                :image-url="gen.content?.imageUrl"
                :video-url="gen.content?.videoUrl"
              />
            </div>
          </div>
        </template>

        <!-- Content preview -->
        <div class="min-h-24">
          <!-- Copy -->
          <pre
            v-if="gen.type === 'copy' && gen.content?.text"
            class="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans max-h-48 overflow-y-auto"
          >{{ gen.content.text }}</pre>

          <!-- Image -->
          <img
            v-else-if="gen.type === 'image' && gen.content?.imageUrl"
            :src="gen.content.imageUrl"
            class="w-full rounded-lg"
            alt="Generated image"
          />

          <!-- Video -->
          <video
            v-else-if="gen.type === 'video' && gen.content?.videoUrl"
            :src="gen.content.videoUrl"
            controls
            class="w-full rounded-lg"
          />

          <!-- Animation -->
          <div
            v-else-if="gen.type === 'animation' && gen.content?.animationConfig"
            class="flex items-center justify-center h-24 bg-gray-50 rounded-lg text-xs text-gray-400"
          >
            Animation — view in Generate tab
          </div>

          <!-- Pending/processing -->
          <div v-else class="flex items-center justify-center h-24 text-xs text-gray-400">
            {{ gen.status === 'processing' ? 'Generating...' : 'No content yet' }}
          </div>
        </div>

        <!-- Timestamp -->
        <template #footer>
          <p class="text-xs text-gray-400">
            {{ new Date(gen.createdAt).toLocaleString() }}
          </p>
        </template>
      </Card>
    </div>
  </div>
</template>
