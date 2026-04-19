<script setup lang="ts">
import { computed } from 'vue';
import type { BannerVariation } from '@/composables/useBannerGeneration';
import {
  varBannerStyle,
  varHeadlineStyle,
  varSubStyle,
  varCtaStyle,
  varPositionClasses,
} from '@/utils/bannerStyles';

const props = defineProps<{
  variation: BannerVariation;
  small?: boolean;
}>();

const bannerStyle  = computed(() => varBannerStyle(props.variation));
const posClasses   = computed(() => varPositionClasses(props.variation));
const headStyle    = computed(() => varHeadlineStyle(props.variation, props.small));
const subStyle     = computed(() => varSubStyle(props.variation, props.small));
const ctaStyle     = computed(() => varCtaStyle(props.variation, props.small));
</script>

<template>
  <div class="relative w-full h-full overflow-hidden rounded-lg" :style="bannerStyle">
    <div :class="posClasses">
      <p :style="headStyle">{{ variation.headline }}</p>
      <p v-if="variation.showSub && variation.subheadline" :style="subStyle">{{ variation.subheadline }}</p>
      <span v-if="variation.showCta && variation.cta" :style="ctaStyle">{{ variation.cta }}</span>
    </div>
  </div>
</template>
