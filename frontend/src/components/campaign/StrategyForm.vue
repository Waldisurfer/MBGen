<script setup lang="ts">
import Input from '@/components/ui/Input.vue';
import Textarea from '@/components/ui/Textarea.vue';

defineProps<{
  name: string;
  strategy: string;
}>();

const emit = defineEmits<{
  'update:name': [value: string];
  'update:strategy': [value: string];
}>();
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h2 class="text-xl font-semibold text-gray-900 mb-1">Campaign strategy</h2>
      <p class="text-sm text-gray-500">Give your campaign a name and describe your marketing strategy.</p>
    </div>

    <Input
      :model-value="name"
      label="Campaign name"
      placeholder="e.g. Summer 2025 Launch"
      required
      @update:model-value="emit('update:name', $event)"
    />

    <Textarea
      :model-value="strategy"
      label="Marketing strategy"
      placeholder="Describe your campaign goals, product/service, unique value proposition, and what you want to achieve..."
      :rows="8"
      :max-length="2000"
      auto-resize
      required
      @update:model-value="emit('update:strategy', $event)"
    />
  </div>
</template>
