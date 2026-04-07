<script setup lang="ts">
defineProps<{
  modelValue?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  helper?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
}>();

defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <input
      :type="type ?? 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :class="[
        'w-full px-3 py-2 text-sm rounded-lg border transition-colors',
        'placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
        error
          ? 'border-red-400 bg-red-50'
          : 'border-gray-300 bg-white hover:border-gray-400',
        disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
    <p v-else-if="helper" class="text-xs text-gray-500">{{ helper }}</p>
  </div>
</template>
