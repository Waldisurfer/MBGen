<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string;
    height?: string;
    rounded?: boolean;
    circle?: boolean;
  }>(),
  { rounded: false, circle: false }
);
</script>

<template>
  <div
    :class="[
      'animate-pulse bg-gray-200',
      circle ? 'rounded-full' : rounded ? 'rounded-lg' : 'rounded',
    ]"
    :style="{ width, height }"
  />
</template>
