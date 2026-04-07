<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { gsap } from 'gsap';
import Button from '@/components/ui/Button.vue';
import PlatformBadge from '@/components/preview/PlatformBadge.vue';
import InstructBar from '@/components/preview/InstructBar.vue';
import Skeleton from '@/components/ui/Skeleton.vue';
import { useAnimations } from '@/composables/useAnimations';
import type { GsapAnimationConfig, AnimationElement } from '@/types/generation.types';

const props = defineProps<{
  campaignId: string;
  platform: string;
}>();

const { isLoading, animationConfig, generationId, error, generate, instruct } = useAnimations();
const stageRef = ref<HTMLElement | null>(null);
let timeline: gsap.core.Timeline | null = null;

function applyStyle(el: HTMLElement, style: AnimationElement['style']): void {
  Object.entries(style).forEach(([key, value]) => {
    (el.style as unknown as Record<string, string | number>)[key] = typeof value === 'number' && !['opacity', 'zIndex'].includes(key) ? `${value}px` : String(value);
  });
}

function playAnimation(config: GsapAnimationConfig): void {
  if (!stageRef.value) return;

  timeline?.kill();
  stageRef.value.innerHTML = '';
  stageRef.value.style.background = config.background;

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

  config.elements.forEach((element) => {
    const el = document.createElement(element.type === 'text' ? 'div' : 'div');
    el.id = element.id;
    if (element.content) el.textContent = element.content;
    el.style.position = 'absolute';
    applyStyle(el, element.style);
    stageRef.value!.appendChild(el);

    gsap.set(el, element.animation.from);

    tl.to(
      el,
      {
        ...element.animation.to,
        duration: element.animation.duration ?? 0.7,
        ease: element.animation.ease ?? 'power2.out',
      },
      element.animation.delay ?? 0
    );
  });

  timeline = tl;
}

watch(animationConfig, (config) => {
  if (config) playAnimation(config);
});

onUnmounted(() => timeline?.kill());

async function handleGenerate() {
  await generate(props.campaignId, props.platform);
}

async function handleInstruct(instruction: string) {
  if (!generationId.value) return;
  await instruct(generationId.value, instruction);
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-gray-700">Animation</span>
        <PlatformBadge :platform="platform" />
      </div>
      <Button size="sm" :loading="isLoading" @click="handleGenerate">
        {{ animationConfig ? 'Regenerate' : 'Generate' }}
      </Button>
    </div>

    <!-- Content -->
    <div class="flex-1 min-h-0">
      <div v-if="isLoading" class="flex flex-col gap-2">
        <Skeleton height="200px" rounded />
        <p class="text-xs text-center text-gray-400">Generating animation config...</p>
      </div>

      <div v-else-if="error" class="p-3 bg-red-50 rounded-lg text-sm text-red-600">
        {{ error }}
      </div>

      <div
        v-else-if="animationConfig"
        ref="stageRef"
        class="w-full rounded-lg overflow-hidden"
        :style="{ height: '200px', position: 'relative', background: animationConfig.background }"
      />

      <div v-else class="flex items-center justify-center h-48 text-sm text-gray-400">
        Click Generate to create an animation
      </div>
    </div>

    <InstructBar
      v-if="animationConfig"
      :loading="isLoading"
      placeholder="Make it faster, change the entrance animation, add a bounce effect..."
      @submit="handleInstruct"
    />
  </div>
</template>
