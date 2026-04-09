<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Badge from '@/components/ui/Badge.vue';
import { useUiStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

interface HealthResponse {
  status: string;
  services: {
    anthropic: boolean;
    replicate: boolean;
    googleAiStudio: boolean;
    googleVertexAi: boolean;
    r2: boolean;
    database: boolean;
  };
}

const ui   = useUiStore();
const auth = useAuthStore();

const health = ref<HealthResponse | null>(null);
const healthLoading = ref(true);

interface StyleGuidelines { colors: string[]; fonts: string[]; variables: Array<{ name: string; value: string }>; }
const styleGuidelines = ref<StyleGuidelines | null>(null);
const styleUploading  = ref(false);
const styleFileInput  = ref<HTMLInputElement | null>(null);

onMounted(async () => {
  try {
    health.value = await api.get<HealthResponse>('/health');
  } finally {
    healthLoading.value = false;
  }
  try {
    const s = await api.get<{ guidelines: StyleGuidelines | null }>('/styles/current');
    styleGuidelines.value = s.guidelines;
  } catch { /* ignore */ }
});

async function uploadStyle(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  styleUploading.value = true;
  try {
    const form = new FormData();
    form.append('file', file);
    const result = await api.postForm<{ guidelines: StyleGuidelines }>('/styles/upload', form);
    styleGuidelines.value = result.guidelines;
    await auth.refreshProfile();
    ui.showToast('Brand style uploaded', 'success');
  } catch (err) {
    ui.showToast((err as Error).message, 'error');
  } finally {
    styleUploading.value = false;
    if (styleFileInput.value) styleFileInput.value.value = '';
  }
}

async function clearStyle() {
  await api.delete('/styles/current');
  styleGuidelines.value = null;
  await auth.refreshProfile();
  ui.showToast('Brand style removed', 'info');
}
</script>

<template>
  <div class="p-8 max-w-2xl">
    <h1 class="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
    <p class="text-sm text-gray-500 mb-8">Manage your brand style and check service status.</p>

    <div class="flex flex-col gap-6">
      <!-- Brand Style Import -->
      <Card>
        <template #header>
          <h2 class="text-base font-semibold text-gray-900">Brand Style</h2>
          <p class="text-xs text-gray-500 mt-0.5">Upload your CSS or component file. Claude will follow your brand colors, fonts, and variables when generating suggestions.</p>
        </template>

        <!-- Current style -->
        <div v-if="styleGuidelines" class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">✓ Brand style active</span>
            <Button variant="secondary" size="sm" @click="clearStyle">Remove</Button>
          </div>
          <div v-if="styleGuidelines.colors.length" class="space-y-1">
            <p class="text-xs text-gray-500 font-medium">Colors detected</p>
            <div class="flex flex-wrap gap-1.5">
              <div v-for="c in styleGuidelines.colors" :key="c" class="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                <div class="w-3 h-3 rounded-full border border-gray-200" :style="{ background: c }" />
                <span class="font-mono text-xs text-gray-600">{{ c }}</span>
              </div>
            </div>
          </div>
          <div v-if="styleGuidelines.fonts.length" class="space-y-1">
            <p class="text-xs text-gray-500 font-medium">Fonts detected</p>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="f in styleGuidelines.fonts" :key="f" class="px-2 py-1 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600">{{ f }}</span>
            </div>
          </div>
          <div v-if="styleGuidelines.variables.length" class="space-y-1">
            <p class="text-xs text-gray-500 font-medium">CSS variables ({{ styleGuidelines.variables.length }})</p>
            <div class="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
              <div v-for="v in styleGuidelines.variables" :key="v.name" class="text-xs font-mono text-gray-500 truncate">
                --{{ v.name }}: {{ v.value }}
              </div>
            </div>
          </div>
        </div>

        <!-- Upload area -->
        <div v-else>
          <label class="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-brand-400 transition-colors">
            <input ref="styleFileInput" type="file" accept=".css,.vue,.scss" class="hidden" @change="uploadStyle" />
            <p class="text-sm text-gray-600 font-medium">{{ styleUploading ? 'Uploading…' : 'Drop your CSS file here' }}</p>
            <p class="text-xs text-gray-400 mt-1">Accepts .css, .vue, .scss — max 50KB</p>
          </label>
        </div>
      </Card>

      <!-- Live service status -->
      <Card>
        <template #header>
          <h2 class="text-base font-semibold text-gray-900">Service Status</h2>
          <p class="text-xs text-gray-500 mt-0.5">Live check of which services are available.</p>
        </template>

        <div v-if="healthLoading" class="text-sm text-gray-400">Checking...</div>

        <div v-else-if="health" class="space-y-2.5">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700">AI copywriting</span>
            <Badge :variant="health.services.anthropic ? 'success' : 'danger'">
              {{ health.services.anthropic ? 'Available' : 'Unavailable' }}
            </Badge>
          </div>

          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700">Image generation</span>
            <Badge :variant="health.services.replicate ? 'success' : 'warning'">
              {{ health.services.replicate ? 'Available' : 'Unavailable' }}
            </Badge>
          </div>

          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700">Video generation</span>
            <Badge :variant="(health.services.googleAiStudio || health.services.googleVertexAi) ? 'success' : 'warning'">
              {{ (health.services.googleAiStudio || health.services.googleVertexAi) ? 'Available' : 'Unavailable' }}
            </Badge>
          </div>

          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700">Storage</span>
            <Badge :variant="health.services.r2 ? 'success' : 'danger'">
              {{ health.services.r2 ? 'Available' : 'Unavailable' }}
            </Badge>
          </div>
        </div>

        <div v-else class="text-sm text-red-500">Could not reach backend.</div>
      </Card>
    </div>
  </div>
</template>
