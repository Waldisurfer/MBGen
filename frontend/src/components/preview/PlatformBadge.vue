<script setup lang="ts">
import { computed } from 'vue';
import { PLATFORM_SPECS } from '@/lib/platformSpecs';
import type { Platform } from '@/types/generation.types';

const props = defineProps<{ platform: string }>();

const spec = computed(() => PLATFORM_SPECS[props.platform as Platform]);
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
    :style="{ backgroundColor: spec?.color ?? '#6b7280' }"
  >
    {{ spec?.displayName ?? platform }}
  </span>
</template>
