<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/components/ui/Button.vue';

defineProps<{
  loading?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{ submit: [instruction: string] }>();

const instruction = ref('');

function handleSubmit() {
  if (!instruction.value.trim()) return;
  emit('submit', instruction.value.trim());
  instruction.value = '';
}
</script>

<template>
  <div class="flex gap-2 mt-3">
    <input
      v-model="instruction"
      type="text"
      :placeholder="placeholder ?? 'Make it more energetic, change colors, add urgency...'"
      :disabled="loading"
      class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400"
      @keydown.enter.prevent="handleSubmit"
    />
    <Button
      size="sm"
      :loading="loading"
      :disabled="!instruction.trim()"
      @click="handleSubmit"
    >
      Regenerate
    </Button>
  </div>
</template>
