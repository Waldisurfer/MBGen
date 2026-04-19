<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Badge from '@/components/ui/Badge.vue';
import Modal from '@/components/ui/Modal.vue';
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

interface FeatureGuide {
  id: string;
  title: string;
  route: string;
  summary: string;
  steps: string[];
}

const features: FeatureGuide[] = [
  {
    id: 'banner',
    title: 'Banner Studio',
    route: '/banner',
    summary: 'Claude generates HTML/CSS marketing banners from a text description. No design skills needed.',
    steps: [
      'Go to Banner Studio from the sidebar.',
      'Describe your brand, product, and offer in the text box (the more detail, the better).',
      'Choose how many banner variations you want (1–6).',
      'Click Generate — Claude writes and styles the HTML/CSS.',
      'Preview each banner. Use the refinement box to adjust colors, layout, or copy.',
      'Download any banner as a PNG.',
    ],
  },
  {
    id: 'image',
    title: 'Image Studio',
    route: '/images',
    summary: 'Generate marketing-ready images from a text prompt using state-of-the-art AI image models.',
    steps: [
      'Go to Image Studio from the sidebar.',
      'Write a descriptive prompt (e.g. "bold lifestyle product shot, golden hour, minimalist").',
      'Choose an aspect ratio (1:1 for social, 16:9 for banners, 9:16 for Stories).',
      'Select a model — FLUX 1.1 Pro for best quality, FLUX Schnell for speed.',
      'Click Generate and wait ~15–30 seconds.',
      'Download the result directly from the preview.',
    ],
  },
  {
    id: 'campaign',
    title: 'Campaign Generator',
    route: '/campaign/new',
    summary: 'Build a full marketing brief and generate copy, images, animations, and video ads — all in one place.',
    steps: [
      'Click New Campaign and fill in your strategy, audience, and brand details.',
      'Open the campaign to reach the Generate tab.',
      'Run each generator independently: Copy, Image, Animation, Video.',
      'Use the Instruct bar under each result to refine ("make it shorter", "change colors").',
      'Switch models at any time without losing previous results.',
      'Export everything from the Preview tab.',
    ],
  },
  {
    id: 'import',
    title: 'Strategy Import',
    route: '/import',
    summary: 'Paste an existing strategy document and Claude automatically extracts individual campaigns.',
    steps: [
      'Go to Import Strategy from the sidebar.',
      'Paste your full strategy or brief document into the text area.',
      'Click Parse — Claude reads the document and extracts structured campaigns.',
      'Review the extracted campaigns (goal, platforms, audience, budget).',
      'Save any campaign you want to keep — it will appear on your Dashboard.',
    ],
  },
  {
    id: 'history',
    title: 'History',
    route: '/history',
    summary: 'Browse every generation across all your campaigns — search, filter by type, and re-download.',
    steps: [
      'Go to History from the sidebar.',
      'Search by keyword or filter by type (copy, image, animation, video).',
      'Click any result to expand and view the full output.',
      'Use the download button to save images or copy text.',
    ],
  },
];

const activeFeature = ref<FeatureGuide | null>(null);
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

    <!-- Features section -->
    <div class="mt-12">
      <h2 class="text-base font-semibold text-gray-900 mb-1">Features</h2>
      <p class="text-sm text-gray-500 mb-5">Everything you can do with MBGen.</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="feature in features"
          :key="feature.id"
          class="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-3 hover:border-brand-300 hover:shadow-sm transition-all"
        >
          <div>
            <p class="text-sm font-semibold text-gray-900">{{ feature.title }}</p>
            <p class="text-xs text-gray-500 mt-1 leading-relaxed">{{ feature.summary }}</p>
          </div>
          <div class="flex items-center gap-4 mt-auto">
            <button
              class="text-xs text-brand-600 font-medium hover:underline"
              @click="activeFeature = feature"
            >
              How to use →
            </button>
            <button
              class="text-xs text-gray-400 hover:text-gray-600"
              @click="router.push(feature.route)"
            >
              Open
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Feature guide modal -->
    <Modal :open="!!activeFeature" :title="activeFeature?.title" @close="activeFeature = null">
      <ol class="space-y-3">
        <li
          v-for="(step, i) in activeFeature?.steps"
          :key="i"
          class="flex gap-3 text-sm text-gray-700"
        >
          <span class="flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center mt-0.5">
            {{ i + 1 }}
          </span>
          {{ step }}
        </li>
      </ol>
      <template #footer>
        <Button @click="router.push(activeFeature!.route); activeFeature = null">
          Open {{ activeFeature?.title }}
        </Button>
        <Button variant="secondary" @click="activeFeature = null">Close</Button>
      </template>
    </Modal>
  </div>
</template>
