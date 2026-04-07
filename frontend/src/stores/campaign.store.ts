import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Campaign, CampaignFormData } from '@/types/campaign.types';
import { api } from '@/lib/api';

export const useCampaignStore = defineStore('campaign', () => {
  const campaigns = ref<Campaign[]>([]);
  const currentCampaign = ref<Campaign | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const hasBrief = computed(() => !!currentCampaign.value?.brief);

  async function fetchCampaigns(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      campaigns.value = await api.get<Campaign[]>('/campaigns');
    } catch (err) {
      error.value = (err as Error).message;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchCampaign(id: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      currentCampaign.value = await api.get<Campaign>(`/campaigns/${id}`);
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function createCampaign(data: CampaignFormData): Promise<Campaign> {
    isLoading.value = true;
    error.value = null;
    try {
      const campaign = await api.post<Campaign>('/campaigns', data);
      campaigns.value.unshift(campaign);
      currentCampaign.value = campaign;
      return campaign;
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function clearCurrent(): void {
    currentCampaign.value = null;
  }

  return {
    campaigns,
    currentCampaign,
    isLoading,
    error,
    hasBrief,
    fetchCampaigns,
    fetchCampaign,
    createCampaign,
    clearCurrent,
  };
});
