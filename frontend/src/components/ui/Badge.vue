<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
  }>(),
  { variant: 'default', size: 'sm' }
);
</script>

<template>
  <span
    :class="[
      'inline-flex items-center font-medium rounded-full',
      size === 'sm' && 'px-2 py-0.5 text-xs',
      size === 'md' && 'px-2.5 py-1 text-sm',
      variant === 'default' && 'bg-gray-100 text-gray-700',
      variant === 'success' && 'bg-green-100 text-green-700',
      variant === 'warning' && 'bg-amber-100 text-amber-700',
      variant === 'danger' && 'bg-red-100 text-red-700',
      variant === 'info' && 'bg-blue-100 text-blue-700',
    ]"
  >
    <slot />
  </span>
</template>
