<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/components/ui/Button.vue';
import Skeleton from '@/components/ui/Skeleton.vue';
import PlatformBadge from '@/components/preview/PlatformBadge.vue';
import InstructBar from '@/components/preview/InstructBar.vue';
import ExportButton from '@/components/preview/ExportButton.vue';
import { useCopy } from '@/composables/useCopy';
import type { Generation } from '@/types/generation.types';

const props = defineProps<{
  campaignId: string;
  platform: string;
}>();

const { isLoading, error, lastCostUsd, generate, instruct } = useCopy();
const generation = ref<Generation | null>(null);
const contentRef = ref<HTMLElement | null>(null);

const copyText = () => generation.value?.content?.text ?? '';

async function handleGenerate() {
  generation.value = await generate(props.campaignId, props.platform);
}

async function handleInstruct(instruction: string) {
  if (!generation.value) return;
  generation.value = await instruct(generation.value.id, instruction);
}

function handleCopy() {
  if (copyText()) navigator.clipboard.writeText(copyText());
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-gray-700">Copy</span>
        <PlatformBadge :platform="platform" />
      </div>
      <div class="flex items-center gap-2">
        <ExportButton
          v-if="generation"
          type="copy"
          :export-ref="contentRef"
        />
        <Button size="sm" :loading="isLoading" @click="handleGenerate">
          {{ generation ? 'Regenerate' : 'Generate' }}
        </Button>
      </div>
      <p v-if="lastCostUsd !== null" class="text-xs text-gray-400 mt-1 text-right font-mono">
        cost: ${{ lastCostUsd.toFixed(4) }}
      </p>
    </div>

    <!-- Content area -->
    <div class="flex-1 min-h-0">
      <!-- Skeleton -->
      <div v-if="isLoading" class="flex flex-col gap-2">
        <Skeleton height="16px" rounded />
        <Skeleton height="16px" rounded width="90%" />
        <Skeleton height="16px" rounded width="75%" />
        <Skeleton height="16px" rounded />
        <Skeleton height="16px" rounded width="80%" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="p-3 bg-red-50 rounded-lg text-sm text-red-600">
        {{ error }}
      </div>

      <!-- Result -->
      <div
        v-else-if="generation"
        ref="contentRef"
        class="relative group"
      >
        <pre
          class="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-sans p-4 bg-gray-50 rounded-lg"
        >{{ copyText() }}</pre>
        <button
          class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-500 hover:text-gray-700"
          @click="handleCopy"
        >
          Copy
        </button>
      </div>

      <!-- Empty state -->
      <div v-else class="flex items-center justify-center h-32 text-sm text-gray-400">
        Click Generate to create copy
      </div>
    </div>

    <!-- Instruct bar -->
    <InstructBar
      v-if="generation"
      :loading="isLoading"
      placeholder="Make it shorter, add a sense of urgency, use emojis..."
      @submit="handleInstruct"
    />
  </div>
</template>
