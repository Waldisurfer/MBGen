import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Generation } from '@/types/generation.types';
import { api } from '@/lib/api';

export const useGenerationStore = defineStore('generation', () => {
  // Map of generationId -> Generation
  const generations = ref<Map<string, Generation>>(new Map());
  // Active EventSource instances for SSE
  const eventSources = ref<Map<string, EventSource>>(new Map());

  function setGeneration(gen: Generation): void {
    generations.value.set(gen.id, gen);
  }

  function updateGeneration(id: string, partial: Partial<Generation>): void {
    const existing = generations.value.get(id);
    if (existing) {
      generations.value.set(id, { ...existing, ...partial });
    }
  }

  function getGenerationsForCampaign(campaignId: string): Generation[] {
    return Array.from(generations.value.values()).filter(
      (g) => g.campaignId === campaignId
    );
  }

  function getLatestGeneration(
    campaignId: string,
    type: Generation['type'],
    platform: string
  ): Generation | undefined {
    return getGenerationsForCampaign(campaignId)
      .filter((g) => g.type === type && g.platform === platform)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
  }

  async function fetchHistory(campaignId: string): Promise<void> {
    const result = await api.get<Generation[]>(`/history/${campaignId}`);
    result.forEach((g) => generations.value.set(g.id, g));
  }

  async function startVideoSSE(
    generationId: string,
    onUpdate: (data: Partial<Generation> & { videoUrl?: string }) => void
  ): Promise<void> {
    const existing = eventSources.value.get(generationId);
    if (existing) existing.close();

    // EventSource cannot send Authorization headers — fetch a short-lived token first
    const { token } = await api.get<{ token: string }>(`/video/sse-token/${generationId}`);
    const sseUrl = `${import.meta.env.VITE_API_URL ?? '/api'}/video/status/${generationId}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(sseUrl);

    es.onmessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data as string) as Partial<Generation> & { videoUrl?: string };
      onUpdate(data);
      if (data.status === 'completed' || data.status === 'failed') {
        es.close();
        eventSources.value.delete(generationId);
      }
    };

    es.onerror = () => {
      onUpdate({ status: 'failed' });
      es.close();
      eventSources.value.delete(generationId);
    };

    eventSources.value.set(generationId, es);
  }

  function closeSSE(generationId: string): void {
    eventSources.value.get(generationId)?.close();
    eventSources.value.delete(generationId);
  }

  function clearAll(): void {
    eventSources.value.forEach((es) => es.close());
    eventSources.value.clear();
    generations.value.clear();
  }

  return {
    generations,
    setGeneration,
    updateGeneration,
    getGenerationsForCampaign,
    getLatestGeneration,
    fetchHistory,
    startVideoSSE,
    closeSSE,
    clearAll,
  };
});
