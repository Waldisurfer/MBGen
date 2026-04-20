import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Audience, AudienceFormData } from '@/types/campaign.types';
import { api } from '@/lib/api';

export const useAudienceStore = defineStore('audience', () => {
  const audiences = ref<Audience[]>([]);
  const isLoading = ref(false);

  // First audience is the most recently used (backend orders by lastUsedAt DESC NULLS LAST)
  const latestAudience = computed(() => audiences.value[0] ?? null);

  async function fetchAudiences(): Promise<void> {
    isLoading.value = true;
    try {
      audiences.value = await api.get<Audience[]>('/audiences');
    } finally {
      isLoading.value = false;
    }
  }

  async function createAudience(data: AudienceFormData): Promise<Audience> {
    const audience = await api.post<Audience>('/audiences', data);
    audiences.value.unshift(audience);
    return audience;
  }

  async function updateAudience(id: string, data: AudienceFormData): Promise<Audience> {
    const audience = await api.put<Audience>(`/audiences/${id}`, data);
    const idx = audiences.value.findIndex(a => a.id === id);
    if (idx !== -1) audiences.value[idx] = audience;
    return audience;
  }

  async function deleteAudience(id: string): Promise<void> {
    await api.delete(`/audiences/${id}`);
    audiences.value = audiences.value.filter(a => a.id !== id);
  }

  async function markUsed(id: string): Promise<void> {
    await api.post(`/audiences/${id}/use`);
    // Move to front (most recently used)
    const idx = audiences.value.findIndex(a => a.id === id);
    if (idx > 0) {
      const [audience] = audiences.value.splice(idx, 1);
      audiences.value.unshift({ ...audience, lastUsedAt: new Date().toISOString() });
    }
  }

  return {
    audiences,
    isLoading,
    latestAudience,
    fetchAudiences,
    createAudience,
    updateAudience,
    deleteAudience,
    markUsed,
  };
});
