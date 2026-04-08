<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from '@/components/ui/Button.vue';
import Skeleton from '@/components/ui/Skeleton.vue';
import ModelSelector from '@/components/ui/ModelSelector.vue';
import PlatformBadge from '@/components/preview/PlatformBadge.vue';
import InstructBar from '@/components/preview/InstructBar.vue';
import ExportButton from '@/components/preview/ExportButton.vue';
import { useImages } from '@/composables/useImages';
import { useImageModels } from '@/composables/useModelList';

const props = defineProps<{
  campaignId: string;
  platform: string;
}>();

const { status, imageUrl, generationId, error, estimatedCostUsd, generate, instruct } = useImages();
const models = useImageModels();
const selectedModel = ref('flux-1.1-pro');
const imageRef = ref<HTMLElement | null>(null);

const activeModel = computed(() => models.value.find((m) => m.id === selectedModel.value));

async function handleGenerate() {
  await generate(props.campaignId, props.platform, selectedModel.value);
}

async function handleInstruct(instruction: string) {
  if (!generationId.value) return;
  await instruct(generationId.value, instruction, selectedModel.value);
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-gray-700">Image</span>
        <PlatformBadge :platform="platform" />
      </div>
      <div class="flex items-center gap-2">
        <ExportButton
          v-if="imageUrl"
          type="image"
          :image-url="imageUrl"
          :export-ref="imageRef"
        />
        <Button
          size="sm"
          :loading="status === 'processing'"
          @click="handleGenerate"
        >
          {{ imageUrl ? 'Regenerate' : 'Generate' }}
        </Button>
      </div>
      <p v-if="estimatedCostUsd !== null" class="text-xs text-gray-400 mt-1 text-right font-mono">
        {{ status === 'processing' ? 'est.' : 'cost:' }} ${{ estimatedCostUsd.toFixed(4) }}
      </p>
    </div>

    <!-- Model selector -->
    <div v-if="models.length > 1" class="mb-3">
      <ModelSelector
        v-model="selectedModel"
        :models="models"
        :disabled="status === 'processing'"
      />
    </div>

    <!-- Content -->
    <div class="flex-1 min-h-0 rounded-lg overflow-hidden bg-gray-50">
      <!-- Processing skeleton -->
      <div v-if="status === 'processing'" class="w-full h-full flex flex-col items-center justify-center gap-3 p-6">
        <Skeleton width="100%" height="200px" rounded />
        <p class="text-xs text-gray-400">
          Generating with {{ activeModel?.displayName ?? 'AI' }}...
          (~{{ activeModel?.estimatedSeconds ?? 15 }}s)
        </p>
      </div>

      <!-- Error -->
      <div v-else-if="status === 'failed'" class="p-4 text-sm text-red-600 bg-red-50 rounded-lg h-full flex items-center justify-center">
        {{ error ?? 'Generation failed. Try again.' }}
      </div>

      <!-- Image result -->
      <div v-else-if="imageUrl" ref="imageRef" class="relative">
        <img
          :src="imageUrl"
          :alt="`Generated image for ${platform}`"
          class="w-full h-auto rounded-lg"
        />
      </div>

      <!-- Empty state -->
      <div v-else class="flex items-center justify-center h-48 text-sm text-gray-400">
        Click Generate to create an image
      </div>
    </div>

    <!-- Instruct bar -->
    <InstructBar
      v-if="imageUrl"
      :loading="status === 'processing'"
      placeholder="Change colors, make it more minimalist, add product focus..."
      @submit="handleInstruct"
    />
  </div>
</template>
