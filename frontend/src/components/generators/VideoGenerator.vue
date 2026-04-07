<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from '@/components/ui/Button.vue';
import ModelSelector from '@/components/ui/ModelSelector.vue';
import PlatformBadge from '@/components/preview/PlatformBadge.vue';
import InstructBar from '@/components/preview/InstructBar.vue';
import ExportButton from '@/components/preview/ExportButton.vue';
import { useVideo } from '@/composables/useVideo';
import { useVideoModels } from '@/composables/useModelList';

const props = defineProps<{
  campaignId: string;
  platform: string;
}>();

const { status, videoUrl, generationId, progress, error, generate, instruct } = useVideo();
const models = useVideoModels();
const selectedModel = ref('veo-2');

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
        <span class="text-sm font-semibold text-gray-700">Video</span>
        <PlatformBadge :platform="platform" />
      </div>
      <div class="flex items-center gap-2">
        <ExportButton
          v-if="videoUrl"
          type="video"
          :video-url="videoUrl"
        />
        <Button
          size="sm"
          :loading="status === 'processing'"
          @click="handleGenerate"
        >
          {{ videoUrl ? 'Regenerate' : 'Generate' }}
        </Button>
      </div>
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
      <!-- Processing state -->
      <div
        v-if="status === 'processing'"
        class="h-full flex flex-col items-center justify-center gap-4 p-6"
      >
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-brand-600 h-2 rounded-full transition-all duration-1000"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <p class="text-xs text-gray-500 text-center">
          Generating with {{ activeModel?.displayName ?? 'AI' }}...<br />
          (~{{ activeModel?.estimatedSeconds ? Math.ceil(activeModel.estimatedSeconds / 60) + ' min' : '2–3 min' }})
        </p>
      </div>

      <!-- Error -->
      <div
        v-else-if="status === 'failed'"
        class="p-4 text-sm text-red-600 bg-red-50 rounded-lg h-full flex items-center justify-center"
      >
        {{ error ?? 'Video generation failed. Try again.' }}
      </div>

      <!-- Video result -->
      <video
        v-else-if="videoUrl"
        :src="videoUrl"
        controls
        class="w-full rounded-lg"
        preload="metadata"
      />

      <!-- Empty state -->
      <div v-else class="flex items-center justify-center h-48 text-sm text-gray-400 text-center px-4">
        Click Generate to create a video ad
      </div>
    </div>

    <InstructBar
      v-if="videoUrl"
      :loading="status === 'processing'"
      placeholder="Make it more cinematic, change the pacing, add more energy..."
      @submit="handleInstruct"
    />
  </div>
</template>
