<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { CSSProperties } from 'vue';

const props = defineProps<{
  modelValue: string;
  style?: CSSProperties;
  multiline?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [string];
}>();

const elRef = ref<HTMLElement | null>(null);

function getPlainText(el: HTMLElement): string {
  return el.innerText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

function onBlur() {
  if (!elRef.value) return;
  emit('update:modelValue', getPlainText(elRef.value));
}

function onKeydown(e: KeyboardEvent) {
  if (!props.multiline && e.key === 'Enter') {
    e.preventDefault();
    (e.target as HTMLElement).blur();
  }
}

// Sync external modelValue changes without clobbering cursor position
watch(() => props.modelValue, (val) => {
  if (elRef.value && elRef.value !== document.activeElement) {
    elRef.value.innerText = val;
  }
});

onMounted(() => {
  if (elRef.value) {
    elRef.value.innerText = props.modelValue;
  }
});
</script>

<template>
  <div
    ref="elRef"
    contenteditable="true"
    :data-placeholder="placeholder"
    :style="style"
    class="outline-none cursor-text focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 rounded px-1 -mx-1 transition-shadow min-w-[2ch]"
    @blur="onBlur"
    @keydown="onKeydown"
  />
</template>
