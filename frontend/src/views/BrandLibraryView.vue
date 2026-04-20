<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useBrandStore } from '@/stores/brand.store';
import { useUiStore } from '@/stores/ui.store';
import type { Brand, BrandFormData } from '@/types/campaign.types';

const brandStore = useBrandStore();
const ui = useUiStore();

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly & Approachable' },
  { value: 'bold', label: 'Bold & Confident' },
  { value: 'playful', label: 'Playful & Fun' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'urgent', label: 'Urgent & Direct' },
];

onMounted(() => brandStore.fetchBrands());

// Form state
const showForm = ref(false);
const editingId = ref<string | null>(null);
const isSaving = ref(false);
const colorInput = ref('#000000');
const fontInput = ref('');

function emptyForm(): BrandFormData {
  return { name: '', description: '', tone: '', colors: [], fonts: [] };
}

const form = reactive<BrandFormData>(emptyForm());

function openCreate() {
  editingId.value = null;
  Object.assign(form, emptyForm());
  colorInput.value = '#000000';
  fontInput.value = '';
  showForm.value = true;
}

function openEdit(brand: Brand) {
  editingId.value = brand.id;
  Object.assign(form, {
    name: brand.name,
    description: brand.description,
    tone: brand.tone,
    colors: [...brand.colors],
    fonts: [...brand.fonts],
    logoKey: brand.logoKey,
  });
  colorInput.value = '#000000';
  fontInput.value = '';
  showForm.value = true;
}

function cancel() {
  showForm.value = false;
  editingId.value = null;
}

function addColor() {
  if (!colorInput.value || form.colors.includes(colorInput.value)) return;
  form.colors.push(colorInput.value);
}

function removeColor(c: string) {
  form.colors = form.colors.filter(x => x !== c);
}

function addFont() {
  const f = fontInput.value.trim();
  if (!f || form.fonts.includes(f)) return;
  form.fonts.push(f);
  fontInput.value = '';
}

function removeFont(f: string) {
  form.fonts = form.fonts.filter(x => x !== f);
}

function isValid() {
  return form.name.trim() && form.description.trim() && form.tone;
}

async function save() {
  if (!isValid()) return;
  isSaving.value = true;
  try {
    if (editingId.value) {
      await brandStore.updateBrand(editingId.value, { ...form });
      ui.showToast('Brand updated', 'success');
    } else {
      await brandStore.createBrand({ ...form });
      ui.showToast('Brand created', 'success');
    }
    cancel();
  } catch (err) {
    ui.showToast((err as Error).message ?? 'Failed to save brand', 'error');
  } finally {
    isSaving.value = false;
  }
}

async function remove(brand: Brand) {
  try {
    await brandStore.deleteBrand(brand.id);
    ui.showToast('Brand deleted', 'success');
  } catch (err) {
    ui.showToast((err as Error).message ?? 'Failed to delete brand', 'error');
  }
}
</script>

<template>
  <div class="p-8 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Brand Library</h1>
        <p class="text-sm text-gray-500 mt-0.5">Save brand identities to reuse across all generation tools.</p>
      </div>
      <button
        class="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
        @click="openCreate"
      >
        + New Brand
      </button>
    </div>

    <!-- Form -->
    <div v-if="showForm" class="mb-8 rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
      <h2 class="text-base font-semibold text-gray-900">{{ editingId ? 'Edit Brand' : 'New Brand' }}</h2>

      <!-- Name -->
      <div>
        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Brand name *</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="e.g. Acme Corp"
          class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <!-- Description -->
      <div>
        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">What the brand does *</label>
        <textarea
          v-model="form.description"
          rows="3"
          placeholder="A brief description of the brand, product, or service — used to feed AI context."
          class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <!-- Tone -->
      <div>
        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Brand tone *</label>
        <select
          v-model="form.tone"
          class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="" disabled>Select tone</option>
          <option v-for="opt in TONE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <!-- Colors -->
      <div>
        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Brand colors</label>
        <div class="flex items-center gap-2 mb-2">
          <input v-model="colorInput" type="color" class="w-10 h-9 rounded border border-gray-300 cursor-pointer p-0.5" />
          <button type="button" class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg" @click="addColor">Add color</button>
        </div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="color in form.colors" :key="color"
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
        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Brand fonts</label>
        <div class="flex items-center gap-2 mb-2">
          <input
            v-model="fontInput" type="text"
            placeholder="e.g. Inter, Helvetica Neue"
            class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            @keydown.enter.prevent="addFont"
          />
          <button type="button" class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg" @click="addFont">Add</button>
        </div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="font in form.fonts" :key="font"
            class="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs"
          >
            {{ font }}
            <button type="button" class="text-gray-400 hover:text-gray-600" @click="removeFont(font)">×</button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" class="text-sm text-gray-500 hover:text-gray-700" @click="cancel">Cancel</button>
        <button
          type="button"
          :disabled="!isValid() || isSaving"
          class="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
          @click="save"
        >
          {{ isSaving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Brand' }}
        </button>
      </div>
    </div>

    <!-- Brand list -->
    <div v-if="brandStore.isLoading" class="text-sm text-gray-400 text-center py-12">Loading…</div>

    <div v-else-if="!brandStore.brands.length && !showForm" class="text-center py-16">
      <div class="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <p class="text-base font-semibold text-gray-800">No brands yet</p>
      <p class="text-sm text-gray-400 mt-1">Create your first brand to start generating on-brand content.</p>
      <button class="mt-4 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700" @click="openCreate">
        + New Brand
      </button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="brand in brandStore.brands"
        :key="brand.id"
        class="rounded-2xl border border-gray-200 bg-white px-5 py-4 flex items-center gap-4"
      >
        <!-- Color swatches -->
        <div class="flex gap-1 shrink-0">
          <div
            v-for="color in brand.colors.slice(0, 4)"
            :key="color"
            class="w-5 h-5 rounded-full border border-gray-200"
            :style="{ background: color }"
            :title="color"
          />
          <div v-if="!brand.colors.length" class="w-5 h-5 rounded-full border border-dashed border-gray-300" />
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 text-sm truncate">{{ brand.name }}</p>
          <p class="text-xs text-gray-500 capitalize mt-0.5">{{ brand.tone }}</p>
          <p v-if="brand.fonts.length" class="text-xs text-gray-400 mt-0.5 truncate">{{ brand.fonts.join(', ') }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            class="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            @click="openEdit(brand)"
          >Edit</button>
          <button
            class="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            @click="remove(brand)"
          >Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
