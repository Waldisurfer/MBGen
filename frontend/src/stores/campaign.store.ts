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
    console.log('[campaign.store] fetchCampaigns');
    isLoading.value = true;
    error.value = null;
    try {
      campaigns.value = await api.get<Campaign[]>('/campaigns');
      console.log(`[campaign.store] fetchCampaigns loaded ${campaigns.value.length} campaigns`);
    } catch (err) {
      console.error('[campaign.store] fetchCampaigns error:', (err as Error).message);
      error.value = (err as Error).message;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchCampaign(id: string): Promise<void> {
    console.log(`[campaign.store] fetchCampaign id=${id}`);
    isLoading.value = true;
    error.value = null;
    try {
      currentCampaign.value = await api.get<Campaign>(`/campaigns/${id}`);
      console.log(`[campaign.store] fetchCampaign loaded: ${currentCampaign.value?.name}`);
    } catch (err) {
      console.error(`[campaign.store] fetchCampaign error:`, (err as Error).message);
      error.value = (err as Error).message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function createCampaign(data: CampaignFormData): Promise<Campaign> {
    console.log(`[campaign.store] createCampaign name="${data.name}"`);
    isLoading.value = true;
    error.value = null;
    try {
      const campaign = await api.post<Campaign>('/campaigns', data);
      campaigns.value.unshift(campaign);
      currentCampaign.value = campaign;
      console.log(`[campaign.store] createCampaign created id=${campaign.id}`);
      return campaign;
    } catch (err) {
      console.error('[campaign.store] createCampaign error:', (err as Error).message);
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
