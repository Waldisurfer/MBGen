import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const useUiStore = defineStore('ui', () => {
  const campaignStep = ref<1 | 2 | 3 | 4>(1);
  const toasts = ref<Toast[]>([]);
  const activeModal = ref<string | null>(null);

  function setCampaignStep(step: 1 | 2 | 3 | 4): void {
    campaignStep.value = step;
  }

  function resetCampaignStep(): void {
    campaignStep.value = 1;
  }

  function showToast(message: string, type: Toast['type'] = 'info'): void {
    const id = Math.random().toString(36).slice(2);
    toasts.value.push({ id, message, type });
    setTimeout(() => dismissToast(id), 4000);
  }

  function dismissToast(id: string): void {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx !== -1) toasts.value.splice(idx, 1);
  }

  function openModal(name: string): void {
    activeModal.value = name;
  }

  function closeModal(): void {
    activeModal.value = null;
  }

  return {
    campaignStep,
    toasts,
    activeModal,
    setCampaignStep,
    resetCampaignStep,
    showToast,
    dismissToast,
    openModal,
    closeModal,
  };
});
