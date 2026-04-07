<script setup lang="ts">
import Badge from '@/components/ui/Badge.vue';
import type { ImageModelInfo, VideoModelInfo } from '@/types/model.types';

type ModelInfo = ImageModelInfo | VideoModelInfo;

const props = defineProps<{
  models: ModelInfo[];
  modelValue: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <div class="flex gap-1.5 flex-wrap">
    <button
      v-for="model in models"
      :key="model.id"
      type="button"
      :disabled="disabled"
      :class="[
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
        'border transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        modelValue === model.id
          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
      ]"
      @click="emit('update:modelValue', model.id)"
    >
      {{ model.displayName }}
      <Badge
        v-if="model.badge"
        :variant="modelValue === model.id ? 'default' : (model.badgeVariant as 'success' | 'info' | 'warning' | 'default' | 'danger' ?? 'default')"
        :class="modelValue === model.id ? 'bg-white/20 text-white' : ''"
      >
        {{ model.badge }}
      </Badge>
    </button>
  </div>
</template>
