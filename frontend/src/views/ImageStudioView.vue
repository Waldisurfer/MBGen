<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from '@/components/ui/Button.vue';
import Skeleton from '@/components/ui/Skeleton.vue';
import ModelSelector from '@/components/ui/ModelSelector.vue';
import { useImages } from '@/composables/useImages';
import { useImageModels } from '@/composables/useModelList';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

const prompt = ref('');
const aspectRatio = ref<AspectRatio>('1:1');
const selectedModel = ref('flux-1.1-pro');
const { status, imageUrl, error, generateDirect } = useImages();
const models = useImageModels();

const activeModel = computed(() => models.value.find((m) => m.id === selectedModel.value));

const aspectRatios: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
];

async function handleGenerate() {
  if (!prompt.value.trim()) return;
  await generateDirect(prompt.value.trim(), aspectRatio.value, selectedModel.value);
}

function handleDownload() {
  if (!imageUrl.value) return;
  const a = document.createElement('a');
  a.href = imageUrl.value;
  a.download = 'generated-image.webp';
  a.target = '_blank';
  a.click();
}
</script>

<template>
  <div class="p-8 max-w-3xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Image Studio</h1>
      <p class="text-sm text-gray-500 mt-0.5">Generate marketing images from a text prompt.</p>
    </div>

    <!-- Prompt input -->
    <div class="space-y-3 mb-6">
      <textarea
        v-model="prompt"
        rows="4"
        placeholder="A bold lifestyle product shot of a sleek water bottle on a mountain summit, golden hour lighting, minimalist style..."
        class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        @keydown.meta.enter="handleGenerate"
        @keydown.ctrl.enter="handleGenerate"
      />

      <!-- Aspect ratio + model + generate -->
      <div class="space-y-2.5">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 w-20 shrink-0">Aspect ratio</span>
          <div class="flex gap-1">
            <button
              v-for="ar in aspectRatios"
              :key="ar.value"
              :class="[
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                aspectRatio === ar.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ]"
              @click="aspectRatio = ar.value"
            >
              {{ ar.label }}
            </button>
          </div>
        </div>

        <div v-if="models.length > 1" class="flex items-start gap-2">
          <span class="text-xs text-gray-500 w-20 shrink-0 pt-1.5">Model</span>
          <ModelSelector
            v-model="selectedModel"
            :models="models"
            :disabled="status === 'processing'"
          />
        </div>

        <div class="flex justify-end">
          <Button
            :loading="status === 'processing'"
            :disabled="!prompt.trim()"
            @click="handleGenerate"
          >
            Generate
          </Button>
        </div>
      </div>
    </div>

    <!-- Result area -->
    <div class="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden min-h-64">
      <!-- Processing -->
      <div
        v-if="status === 'processing'"
        class="flex flex-col items-center justify-center gap-3 p-10"
      >
        <Skeleton width="100%" height="320px" rounded />
        <p class="text-xs text-gray-400">
          Generating with {{ activeModel?.displayName ?? 'AI' }}...
          (~{{ activeModel?.estimatedSeconds ?? 15 }}s)
        </p>
      </div>

      <!-- Error -->
      <div
        v-else-if="status === 'failed'"
        class="flex items-center justify-center p-10 text-sm text-red-600"
      >
        {{ error ?? 'Generation failed. Try again.' }}
      </div>

      <!-- Image result -->
      <div v-else-if="imageUrl" class="relative group">
        <img
          :src="imageUrl"
          alt="Generated marketing image"
          class="w-full h-auto rounded-2xl"
        />
        <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            class="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white shadow-sm"
            @click="handleDownload"
          >
            Download
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else
        class="flex flex-col items-center justify-center gap-2 p-16 text-center"
      >
        <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p class="text-sm text-gray-400">Your image will appear here</p>
        <p class="text-xs text-gray-300">⌘ + Enter to generate</p>
      </div>
    </div>
  </div>
</template>
