<script setup lang="ts">
import { ref } from 'vue';
import Input from '@/components/ui/Input.vue';
import Select from '@/components/ui/Select.vue';
import type { BrandData } from '@/types/campaign.types';

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly & Approachable' },
  { value: 'bold', label: 'Bold & Confident' },
  { value: 'playful', label: 'Playful & Fun' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'urgent', label: 'Urgent & Direct' },
];

const props = defineProps<{ modelValue: BrandData }>();
const emit = defineEmits<{ 'update:modelValue': [value: BrandData] }>();

const colorInput = ref('');
const fontInput = ref('');

function update(field: keyof BrandData, value: string | string[]) {
  emit('update:modelValue', { ...props.modelValue, [field]: value });
}

function addColor() {
  if (!colorInput.value) return;
  const colors = [...(props.modelValue.colors ?? [])];
  if (!colors.includes(colorInput.value)) colors.push(colorInput.value);
  update('colors', colors);
  colorInput.value = '';
}

function removeColor(color: string) {
  update('colors', (props.modelValue.colors ?? []).filter((c) => c !== color));
}

function addFont() {
  const f = fontInput.value.trim();
  if (!f) return;
  const fonts = [...(props.modelValue.fonts ?? [])];
  if (!fonts.includes(f)) fonts.push(f);
  update('fonts', fonts);
  fontInput.value = '';
}

function removeFont(font: string) {
  update('fonts', (props.modelValue.fonts ?? []).filter((f) => f !== font));
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h2 class="text-xl font-semibold text-gray-900 mb-1">Brand profile</h2>
      <p class="text-sm text-gray-500">Define your brand identity for consistent output.</p>
    </div>

    <Input
      :model-value="modelValue.name"
      label="Brand name"
      placeholder="e.g. Acme Corp"
      required
      @update:model-value="update('name', $event)"
    />

    <Select
      :model-value="modelValue.tone"
      label="Brand tone"
      :options="TONE_OPTIONS"
      placeholder="Select tone"
      required
      @update:model-value="update('tone', $event)"
    />

    <!-- Colors -->
    <div>
      <p class="text-sm font-medium text-gray-700 mb-2">Brand colors</p>
      <div class="flex items-center gap-2 mb-2">
        <input
          v-model="colorInput"
          type="color"
          class="w-10 h-9 rounded border border-gray-300 cursor-pointer p-0.5"
        />
        <button
          type="button"
          class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          @click="addColor"
        >
          Add color
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="color in modelValue.colors"
          :key="color"
          class="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-full text-xs"
        >
          <div class="w-4 h-4 rounded-full border border-gray-200" :style="{ background: color }" />
          <span>{{ color }}</span>
          <button type="button" class="text-gray-400 hover:text-gray-600" @click="removeColor(color)">×</button>
        </div>
      </div>
    </div>

    <!-- Fonts -->
    <div>
      <p class="text-sm font-medium text-gray-700 mb-2">Brand fonts</p>
      <div class="flex items-center gap-2 mb-2">
        <input
          v-model="fontInput"
          type="text"
          class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="e.g. Inter, Helvetica Neue"
          @keydown.enter.prevent="addFont"
        />
        <button
          type="button"
          class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          @click="addFont"
        >
          Add
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="font in modelValue.fonts"
          :key="font"
          class="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs"
        >
          {{ font }}
          <button type="button" class="text-gray-400 hover:text-gray-600" @click="removeFont(font)">×</button>
        </div>
      </div>
    </div>
  </div>
</template>
