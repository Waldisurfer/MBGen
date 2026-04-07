import { ref } from 'vue';
import { api } from '@/lib/api';
import type { ImageModelInfo, VideoModelInfo } from '@/types/model.types';

// Module-level cache — shared across all component instances
const imageModelsCache = ref<ImageModelInfo[]>([]);
const videoModelsCache = ref<VideoModelInfo[]>([]);
let imageFetch: Promise<void> | null = null;
let videoFetch: Promise<void> | null = null;

export function useImageModels() {
  if (!imageFetch) {
    imageFetch = api
      .get<ImageModelInfo[]>('/images/models')
      .then((m) => { imageModelsCache.value = m; })
      .catch(() => {});
  }
  return imageModelsCache;
}

export function useVideoModels() {
  if (!videoFetch) {
    videoFetch = api
      .get<VideoModelInfo[]>('/video/models')
      .then((m) => { videoModelsCache.value = m; })
      .catch(() => {});
  }
  return videoModelsCache;
}
