<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from '@/components/ui/Button.vue';
import Badge from '@/components/ui/Badge.vue';
import Card from '@/components/ui/Card.vue';
import { api } from '@/lib/api';
import { useCampaignStore } from '@/stores/campaign.store';
import { useUiStore } from '@/stores/ui.store';
import type { ParsedCampaignSuggestion, CampaignFormData } from '@/types/campaign.types';

const router = useRouter();
const campaignStore = useCampaignStore();
const ui = useUiStore();

const rawDocument = ref('');
const isExtracting = ref(false);
const suggestions = ref<ParsedCampaignSuggestion[]>([]);
const creatingIndex = ref<number | null>(null);
const extractError = ref<string | null>(null);

async function extract() {
  if (rawDocument.value.trim().length < 50) return;
  isExtracting.value = true;
  extractError.value = null;
  suggestions.value = [];

  try {
    const result = await api.post<{ suggestions: ParsedCampaignSuggestion[] }>(
      '/campaigns/parse-strategy',
      { document: rawDocument.value }
    );
    suggestions.value = result.suggestions;
    if (suggestions.value.length === 0) {
      extractError.value = 'No campaigns found in the document. Try adding more detail.';
    }
  } catch (err) {
    extractError.value = (err as Error).message;
  } finally {
    isExtracting.value = false;
  }
}

function reset() {
  suggestions.value = [];
  extractError.value = null;
}

function buildStrategy(s: ParsedCampaignSuggestion): string {
  const parts = [`Goal: ${s.campaignGoal}`, '', s.strategyNarrative];
  if (s.copyExamples.length > 0) {
    parts.push('', 'Copy examples from strategy document:');
    s.copyExamples.slice(0, 3).forEach((ex) => {
      parts.push(`[${ex.language}]: ${ex.text}`);
    });
  }
  if (s.adFormats.length > 0) {
    parts.push('', `Ad formats: ${s.adFormats.join(', ')}`);
  }
  if (s.dailyBudget) {
    parts.push(`Daily budget: ${s.dailyBudget}`);
  }
  return parts.join('\n');
}

async function createFromSuggestion(s: ParsedCampaignSuggestion, index: number) {
  creatingIndex.value = index;
  const formData: CampaignFormData = {
    name: s.suggestedName,
    strategy: buildStrategy(s),
    audience: s.audience,
    brand: s.brand,
    inspirationKeys: [],
  };

  try {
    const campaign = await campaignStore.createCampaign(formData);
    ui.showToast(`"${campaign.name}" created`, 'success');
    router.push(`/campaign/${campaign.id}/generate`);
  } catch (err) {
    ui.showToast((err as Error).message, 'error');
  } finally {
    creatingIndex.value = null;
  }
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  tiktok: '#010101',
  youtube: '#FF0000',
  linkedin: '#0A66C2',
  twitter: '#1DA1F2',
};

const GOAL_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
  Awareness: 'info',
  Traffic: 'info',
  Engagement: 'warning',
  Conversion: 'success',
};
</script>

<template>
  <div class="p-8 max-w-4xl">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Import Strategy Document</h1>
      <p class="text-sm text-gray-500 mt-0.5">
        Paste a raw strategy document from your marketing team. Claude will extract individual campaign segments automatically.
      </p>
    </div>

    <!-- Input state -->
    <div v-if="suggestions.length === 0">
      <Card>
        <div class="flex flex-col gap-4">
          <textarea
            v-model="rawDocument"
            rows="18"
            placeholder="Paste your media plan, campaign brief, or strategy document here...

Example: campaign names, audience segments, budgets, copy examples, ad formats — Claude handles any format or language."
            class="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400 font-mono"
          />

          <p v-if="extractError" class="text-sm text-red-600">{{ extractError }}</p>

          <div class="flex items-center justify-between">
            <p class="text-xs text-gray-400">
              Supports any language — Polish, German, English, etc.
            </p>
            <Button
              :loading="isExtracting"
              :disabled="rawDocument.trim().length < 50"
              @click="extract"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.346A3.001 3.001 0 0112 15a3 3 0 01-2.121-.879l-.346-.347z" />
              </svg>
              Extract Campaigns
            </Button>
          </div>
        </div>
      </Card>

      <!-- Extracting state overlay -->
      <div v-if="isExtracting" class="mt-4 flex items-center gap-3 text-sm text-gray-500">
        <svg class="w-4 h-4 animate-spin text-brand-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Claude is reading your document and extracting campaign segments...
      </div>
    </div>

    <!-- Results state -->
    <div v-else>
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">
            {{ suggestions.length }} campaign{{ suggestions.length !== 1 ? 's' : '' }} found
          </h2>
          <p class="text-sm text-gray-500">
            {{ suggestions[0]?.documentTitle ?? 'Extracted from document' }}
          </p>
        </div>
        <Button variant="ghost" size="sm" @click="reset">
          Import another document
        </Button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          v-for="(suggestion, index) in suggestions"
          :key="index"
          padding="md"
        >
          <!-- Goal + budget badges -->
          <template #header>
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <Badge :variant="GOAL_VARIANT[suggestion.campaignGoal] ?? 'default'">
                {{ suggestion.campaignGoal }}
              </Badge>
              <span v-if="suggestion.dailyBudget" class="text-xs font-medium text-gray-500">
                {{ suggestion.dailyBudget }}/day
              </span>
            </div>
          </template>

          <!-- Name -->
          <h3 class="font-semibold text-gray-900 text-sm leading-snug mb-1">
            {{ suggestion.suggestedName }}
          </h3>
          <p class="text-xs text-gray-400 mb-3">{{ suggestion.sourceSegmentLabel }}</p>

          <!-- Strategy narrative -->
          <p class="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
            {{ suggestion.strategyNarrative }}
          </p>

          <!-- Audience summary -->
          <div class="mb-4">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Audience</p>
            <p class="text-xs text-gray-600">{{ suggestion.audience.demographics }}</p>
            <!-- Platform chips -->
            <div class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="ch in suggestion.audience.channels"
                :key="ch"
                class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white capitalize"
                :style="{ backgroundColor: PLATFORM_COLORS[ch] ?? '#6b7280' }"
              >
                {{ ch }}
              </span>
            </div>
          </div>

          <!-- Copy examples -->
          <div v-if="suggestion.copyExamples.length > 0" class="mb-4">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Copy examples</p>
            <div class="flex flex-col gap-2">
              <div
                v-for="ex in suggestion.copyExamples.slice(0, 2)"
                :key="ex.language"
                class="flex gap-2 items-start"
              >
                <span class="shrink-0 px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono font-semibold text-gray-600">
                  {{ ex.language }}
                </span>
                <p class="text-xs text-gray-600 line-clamp-2">{{ ex.text }}</p>
              </div>
            </div>
          </div>

          <!-- Ad formats -->
          <div v-if="suggestion.adFormats.length > 0" class="mb-4">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ad formats</p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="fmt in suggestion.adFormats"
                :key="fmt"
                class="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
              >
                {{ fmt }}
              </span>
            </div>
          </div>

          <!-- Create button -->
          <template #footer>
            <Button
              class="w-full"
              :loading="creatingIndex === index"
              :disabled="creatingIndex !== null && creatingIndex !== index"
              @click="createFromSuggestion(suggestion, index)"
            >
              Create Campaign
            </Button>
          </template>
        </Card>
      </div>

      <!-- Create all button -->
      <div v-if="suggestions.length > 1" class="mt-6 flex justify-center">
        <p class="text-xs text-gray-400">
          Campaigns are created one at a time. Click "Create Campaign" on each card.
        </p>
      </div>
    </div>
  </div>
</template>
