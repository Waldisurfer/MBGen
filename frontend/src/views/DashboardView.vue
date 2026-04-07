<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Badge from '@/components/ui/Badge.vue';
import { useCampaignStore } from '@/stores/campaign.store';

const router = useRouter();
const store = useCampaignStore();

onMounted(() => store.fetchCampaigns());

const recent = computed(() => store.campaigns.slice(0, 6));

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function openCampaign(id: string): void {
  router.push(`/campaign/${id}/generate`);
}
</script>

<template>
  <div class="p-8 max-w-5xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-sm text-gray-500 mt-0.5">Your recent campaigns and quick access.</p>
      </div>
      <Button @click="router.push('/campaign/new')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Campaign
      </Button>
    </div>

    <!-- Quick start -->
    <div v-if="recent.length === 0" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center">
        <svg class="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div class="text-center">
        <h2 class="text-lg font-semibold text-gray-900">Start your first campaign</h2>
        <p class="text-sm text-gray-500 mt-1">Create a campaign brief and generate copy, images, animations and video ads with AI.</p>
      </div>
      <Button @click="router.push('/campaign/new')">Create Campaign</Button>
    </div>

    <!-- Campaign grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card
        v-for="campaign in recent"
        :key="campaign.id"
        hover
        @click="openCampaign(campaign.id)"
      >
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-semibold text-gray-900 text-sm leading-tight">{{ campaign.name }}</h3>
          <Badge v-if="campaign.brief" variant="success">Ready</Badge>
          <Badge v-else variant="warning">Draft</Badge>
        </div>
        <p class="text-xs text-gray-500 mt-2 line-clamp-3">{{ campaign.strategy }}</p>
        <p class="text-xs text-gray-400 mt-3">{{ formatDate(campaign.createdAt) }}</p>
      </Card>

      <!-- New campaign card -->
      <div
        class="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
        @click="router.push('/campaign/new')"
      >
        <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xl">+</div>
        <p class="text-sm text-gray-500">New campaign</p>
      </div>
    </div>
  </div>
</template>
