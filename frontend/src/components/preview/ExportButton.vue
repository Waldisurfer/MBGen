<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/components/ui/Button.vue';
import { useExport } from '@/composables/useExport';
import type { GenerationType } from '@/types/generation.types';

const props = defineProps<{
  type: GenerationType;
  imageUrl?: string;
  videoUrl?: string;
  exportRef?: HTMLElement | null;
}>();

const { exportAsPng, exportMp4 } = useExport();
const isExporting = ref(false);

async function handleExport() {
  isExporting.value = true;
  try {
    if (props.type === 'video' && props.videoUrl) {
      exportMp4(props.videoUrl, 'ad-video.mp4');
    } else if ((props.type === 'image' || props.type === 'copy' || props.type === 'animation') && props.exportRef) {
      await exportAsPng(props.exportRef, `ad-${props.type}.png`);
    } else if (props.type === 'image' && props.imageUrl) {
      const a = document.createElement('a');
      a.href = props.imageUrl;
      a.download = 'ad-image.webp';
      a.click();
    }
  } finally {
    isExporting.value = false;
  }
}
</script>

<template>
  <Button variant="secondary" size="sm" :loading="isExporting" @click="handleExport">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
    Export
  </Button>
</template>
