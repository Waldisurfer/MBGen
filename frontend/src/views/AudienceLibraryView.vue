<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useAudienceStore } from '@/stores/audience.store';
import { useUiStore } from '@/stores/ui.store';
import type { Audience, AudienceFormData } from '@/types/campaign.types';

const audienceStore = useAudienceStore();
const ui = useUiStore();

const CHANNELS = ['instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'linkedin'] as const;

onMounted(() => audienceStore.fetchAudiences());

const showForm = ref(false);
const editingId = ref<string | null>(null);
const isSaving = ref(false);

function emptyForm(): AudienceFormData {
  return { name: '', demographics: '', psychographics: '', painPoints: '', channels: [] };
}

const form = reactive<AudienceFormData>(emptyForm());

function openCreate() {
  editingId.value = null;
  Object.assign(form, emptyForm());
  showForm.value = true;
}

function openEdit(audience: Audience) {
  editingId.value = audience.id;
  Object.assign(form, {
    name: audience.name,
    demographics: audience.demographics,
    psychographics: audience.psychographics,
    painPoints: audience.painPoints,
    channels: [...audience.channels],
  });
  showForm.value = true;
}

function cancel() {
  showForm.value = false;
  editingId.value = null;
}

function toggleChannel(channel: string) {
  const idx = form.channels.indexOf(channel);
  if (idx === -1) form.channels.push(channel);
  else form.channels.splice(idx, 1);
}

function isValid() {
  return form.name.trim() && form.demographics.trim() && form.psychographics.trim() && form.painPoints.trim() && form.channels.length > 0;
}

async function save() {
  if (!isValid()) return;
  isSaving.value = true;
  try {
    if (editingId.value) {
      await audienceStore.updateAudience(editingId.value, { ...form });
      ui.showToast('Audience updated', 'success');
    } else {
      await audienceStore.createAudience({ ...form });
      ui.showToast('Audience created', 'success');
    }
    cancel();
  } catch (err) {
    ui.showToast((err as Error).message ?? 'Failed to save audience', 'error');
  } finally {
    isSaving.value = false;
  }
}

async function remove(audience: Audience) {
  try {
    await audienceStore.deleteAudience(audience.id);
    ui.showToast('Audience deleted', 'success');
  } catch (err) {
    ui.showToast((err as Error).message ?? 'Failed to delete audience', 'error');
  }
}
</script>

<template>
  <div class="p-8 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Audience Library</h1>
        <p class="text-sm text-gray-500 mt-0.5">Save target audiences to reuse across all generation tools.</p>
      </div>
      <button
        class="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
        @click="openCreate"
      >
        + New Audience
      </button>
    </div>

    <!-- Form -->
    <div v-if="showForm" class="mb-8 rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
      <h2 class="text-base font-semibold text-gray-900">{{ editingId ? 'Edit Audience' : 'New Audience' }}</h2>

      <div>
        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Audience name *</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="e.g. Young urban professionals"
          class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Demographics *</label>
        <textarea
          v-model="form.demographics"
          rows="2"
          placeholder="Age range, location, gender, income level, occupation..."
          class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <div>
        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Psychographics & interests *</label>
        <textarea
          v-model="form.psychographics"
          rows="2"
          placeholder="Values, lifestyle, hobbies, beliefs, motivations..."
          class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <div>
        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Pain points & needs *</label>
        <textarea
          v-model="form.painPoints"
          rows="2"
          placeholder="What problems does your audience face? What do they need?"
          class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <div>
        <label class="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Target platforms *</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="channel in CHANNELS"
            :key="channel"
            type="button"
            :class="[
              'px-3 py-1.5 text-sm rounded-full border transition-all capitalize',
              form.channels.includes(channel)
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-white border-gray-300 text-gray-600 hover:border-brand-400',
            ]"
            @click="toggleChannel(channel)"
          >{{ channel }}</button>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" class="text-sm text-gray-500 hover:text-gray-700" @click="cancel">Cancel</button>
        <button
          type="button"
          :disabled="!isValid() || isSaving"
          class="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
          @click="save"
        >
          {{ isSaving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Audience' }}
        </button>
      </div>
    </div>

    <!-- Audience list -->
    <div v-if="audienceStore.isLoading" class="text-sm text-gray-400 text-center py-12">Loading…</div>

    <div v-else-if="!audienceStore.audiences.length && !showForm" class="text-center py-16">
      <div class="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p class="text-base font-semibold text-gray-800">No audiences yet</p>
      <p class="text-sm text-gray-400 mt-1">Create your first audience to target the right people in every generation.</p>
      <button class="mt-4 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700" @click="openCreate">
        + New Audience
      </button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="audience in audienceStore.audiences"
        :key="audience.id"
        class="rounded-2xl border border-gray-200 bg-white px-5 py-4 flex items-start gap-4"
      >
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 text-sm">{{ audience.name }}</p>
          <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ audience.demographics }}</p>
          <div class="flex gap-1 mt-2">
            <span
              v-for="ch in audience.channels"
              :key="ch"
              class="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded-full capitalize"
            >{{ ch }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 mt-0.5">
          <button
            class="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            @click="openEdit(audience)"
          >Edit</button>
          <button
            class="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            @click="remove(audience)"
          >Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
