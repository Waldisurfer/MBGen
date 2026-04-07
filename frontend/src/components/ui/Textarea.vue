<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    placeholder?: string;
    error?: string;
    helper?: string;
    rows?: number;
    maxLength?: number;
    autoResize?: boolean;
    disabled?: boolean;
    required?: boolean;
  }>(),
  { rows: 4, autoResize: false }
);

defineEmits<{ 'update:modelValue': [value: string] }>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);

function resize() {
  if (!props.autoResize || !textareaRef.value) return;
  textareaRef.value.style.height = 'auto';
  textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
}

watch(() => props.modelValue, async () => {
  await nextTick();
  resize();
});
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxLength"
      :disabled="disabled"
      :required="required"
      :class="[
        'w-full px-3 py-2 text-sm rounded-lg border transition-colors resize-none',
        'placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
        error
          ? 'border-red-400 bg-red-50'
          : 'border-gray-300 bg-white hover:border-gray-400',
        disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
        autoResize && 'overflow-hidden',
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value); resize()"
    />
    <div class="flex justify-between">
      <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
      <p v-else-if="helper" class="text-xs text-gray-500">{{ helper }}</p>
      <p v-if="maxLength" class="text-xs text-gray-400 ml-auto">
        {{ (modelValue ?? '').length }}/{{ maxLength }}
      </p>
    </div>
  </div>
</template>
