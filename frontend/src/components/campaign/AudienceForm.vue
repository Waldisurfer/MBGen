<script setup lang="ts">
import Textarea from '@/components/ui/Textarea.vue';
import type { AudienceData } from '@/types/campaign.types';

const CHANNELS = ['instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'linkedin'] as const;

const props = defineProps<{ modelValue: AudienceData }>();
const emit = defineEmits<{ 'update:modelValue': [value: AudienceData] }>();

function update(field: keyof AudienceData, value: string | string[]) {
  emit('update:modelValue', { ...props.modelValue, [field]: value });
}

function toggleChannel(channel: string) {
  const current = props.modelValue.channels ?? [];
  const next = current.includes(channel)
    ? current.filter((c) => c !== channel)
    : [...current, channel];
  update('channels', next);
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h2 class="text-xl font-semibold text-gray-900 mb-1">Target audience</h2>
      <p class="text-sm text-gray-500">Describe who you're trying to reach.</p>
    </div>

    <Textarea
      :model-value="modelValue.demographics"
      label="Demographics"
      placeholder="Age range, location, gender, income level, occupation..."
      :rows="3"
      required
      @update:model-value="update('demographics', $event)"
    />

    <Textarea
      :model-value="modelValue.psychographics"
      label="Psychographics & interests"
      placeholder="Values, lifestyle, hobbies, beliefs, motivations..."
      :rows="3"
      required
      @update:model-value="update('psychographics', $event)"
    />

    <Textarea
      :model-value="modelValue.painPoints"
      label="Pain points & needs"
      placeholder="What problems does your audience face? What do they need?"
      :rows="3"
      required
      @update:model-value="update('painPoints', $event)"
    />

    <div>
      <p class="text-sm font-medium text-gray-700 mb-2">Target platforms</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="channel in CHANNELS"
          :key="channel"
          type="button"
          :class="[
            'px-3 py-1.5 text-sm rounded-full border transition-all capitalize',
            modelValue.channels?.includes(channel)
              ? 'bg-brand-600 border-brand-600 text-white'
              : 'bg-white border-gray-300 text-gray-600 hover:border-brand-400',
          ]"
          @click="toggleChannel(channel)"
        >
          {{ channel }}
        </button>
      </div>
    </div>
  </div>
</template>
