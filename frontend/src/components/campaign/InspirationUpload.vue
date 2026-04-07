<script setup lang="ts">
import { ref } from 'vue';
import { api } from '@/lib/api';

const emit = defineEmits<{ 'update:keys': [keys: string[]] }>();

const isDragging = ref(false);
const uploadedFiles = ref<{ name: string; url: string; key: string }[]>([]);
const isUploading = ref(false);
const error = ref<string | null>(null);

async function uploadFile(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) return;

  isUploading.value = true;
  error.value = null;

  try {
    const { presignedUrl, key } = await api.get<{ presignedUrl: string; key: string }>(
      '/campaigns/upload-url',
      { filename: file.name, contentType: file.type }
    );

    await api.putRaw(presignedUrl, file, file.type);

    const localUrl = URL.createObjectURL(file);
    uploadedFiles.value.push({ name: file.name, url: localUrl, key });
    emit('update:keys', uploadedFiles.value.map((f) => f.key));
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    isUploading.value = false;
  }
}

async function onDrop(e: DragEvent): Promise<void> {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer?.files ?? []);
  for (const file of files) await uploadFile(file);
}

async function onFileInput(e: Event): Promise<void> {
  const files = Array.from((e.target as HTMLInputElement).files ?? []);
  for (const file of files) await uploadFile(file);
}

function removeFile(key: string): void {
  uploadedFiles.value = uploadedFiles.value.filter((f) => f.key !== key);
  emit('update:keys', uploadedFiles.value.map((f) => f.key));
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h2 class="text-xl font-semibold text-gray-900 mb-1">Inspiration images</h2>
      <p class="text-sm text-gray-500">
        Upload reference images to guide the visual style (optional).
      </p>
    </div>

    <!-- Drop zone -->
    <div
      :class="[
        'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
        isDragging ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-gray-400',
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <div class="flex flex-col items-center gap-3">
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <div>
          <p class="text-sm text-gray-600">Drag & drop images here, or</p>
          <label
            class="text-sm text-brand-600 font-medium cursor-pointer hover:underline"
          >
            browse files
            <input
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              :disabled="isUploading"
              @change="onFileInput"
            />
          </label>
        </div>
        <p class="text-xs text-gray-400">PNG, JPG, WebP up to 10MB each</p>
      </div>
    </div>

    <p v-if="isUploading" class="text-sm text-brand-600 text-center">Uploading...</p>
    <p v-if="error" class="text-sm text-red-600 text-center">{{ error }}</p>

    <!-- Uploaded images grid -->
    <div v-if="uploadedFiles.length > 0" class="grid grid-cols-3 gap-3">
      <div
        v-for="file in uploadedFiles"
        :key="file.key"
        class="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square"
      >
        <img :src="file.url" :alt="file.name" class="w-full h-full object-cover" />
        <button
          type="button"
          class="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          @click="removeFile(file.key)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>
