<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Card from '@/components/ui/Card.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import PlatformBadge from '@/components/preview/PlatformBadge.vue';
import ExportButton from '@/components/preview/ExportButton.vue';
import { api } from '@/lib/api';
import type { Generation } from '@/types/generation.types';

const generations = ref<Generation[]>([]);
const isLoading = ref(false);
const search = ref('');

onMounted(async () => {
  isLoading.value = true;
  try {
    generations.value = await api.get<Generation[]>('/history');
  } finally {
    isLoading.value = false;
  }
});

const filtered = computed(() => {
  if (!search.value.trim()) return generations.value;
  const q = search.value.toLowerCase();
  return generations.value.filter(
    (g) =>
      g.type.includes(q) ||
      g.platform.includes(q) ||
      g.status.includes(q) ||
      (g.content?.text ?? '').toLowerCase().includes(q)
  );
});

function statusVariant(status: Generation['status']) {
  return status === 'completed' ? 'success' : status === 'failed' ? 'danger' : 'warning';
}
</script>

<template>
  <div class="p-8 max-w-5xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">History</h1>
        <p class="text-sm text-gray-500 mt-0.5">All past generations across campaigns.</p>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-5">
      <input
        v-model="search"
        type="text"
        placeholder="Search by type, platform, or content..."
        class="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>

    <!-- Table -->
    <div v-if="isLoading" class="text-sm text-gray-400">Loading...</div>

    <div v-else-if="filtered.length === 0" class="text-center py-16 text-gray-400">
      No generations found.
    </div>

    <div v-else class="flex flex-col gap-3">
      <Card
        v-for="gen in filtered"
        :key="gen.id"
        padding="sm"
      >
        <div class="flex items-center gap-4">
          <!-- Type + platform -->
          <div class="flex items-center gap-2 w-40 shrink-0">
            <span class="text-sm font-semibold text-gray-700 capitalize">{{ gen.type }}</span>
            <PlatformBadge :platform="gen.platform" />
          </div>

          <!-- Content preview -->
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-600 truncate">
              <template v-if="gen.type === 'copy'">{{ gen.content?.text?.slice(0, 120) }}</template>
              <template v-else-if="gen.type === 'image' && gen.content?.imageUrl">
                <img :src="gen.content.imageUrl" class="h-8 rounded" />
              </template>
              <template v-else>—</template>
            </p>
          </div>

          <!-- Status + date + export -->
          <div class="flex items-center gap-3 shrink-0">
            <Badge :variant="statusVariant(gen.status)" size="sm">{{ gen.status }}</Badge>
            <span class="text-xs text-gray-400">{{ new Date(gen.createdAt).toLocaleDateString() }}</span>
            <ExportButton
              :type="gen.type"
              :image-url="gen.content?.imageUrl"
              :video-url="gen.content?.videoUrl"
            />
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
