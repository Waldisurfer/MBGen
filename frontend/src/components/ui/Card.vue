<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: 'none' | 'sm' | 'md' | 'lg';
    shadow?: boolean;
    hover?: boolean;
  }>(),
  { padding: 'md', shadow: true, hover: false }
);
</script>

<template>
  <div
    :class="[
      'bg-white rounded-xl border border-gray-200',
      shadow && 'shadow-sm',
      hover && 'transition-shadow hover:shadow-md cursor-pointer',
      padding === 'none' && 'p-0',
      padding === 'sm' && 'p-3',
      padding === 'md' && 'p-5',
      padding === 'lg' && 'p-7',
    ]"
  >
    <div v-if="$slots.header" class="mb-4 pb-4 border-b border-gray-100">
      <slot name="header" />
    </div>
    <slot />
    <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-gray-100">
      <slot name="footer" />
    </div>
  </div>
</template>
