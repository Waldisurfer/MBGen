import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Generation, GenerationFeedbackPatch } from '@/types/generation.types';
import { api } from '@/lib/api';

export const useGenerationStore = defineStore('generation', () => {
  // Map of generationId -> Generation
  const generations = ref<Map<string, Generation>>(new Map());
  const selectedBySlot = ref<Map<string, string>>(new Map());
  // Active EventSource instances for SSE
  const eventSources = ref<Map<string, EventSource>>(new Map());

  function slotKey(campaignId: string, type: Generation['type'], platform: string): string {
    return `${campaignId}:${type}:${platform}`;
  }

  function setGeneration(gen: Generation): void {
    const next = new Map(generations.value);
    next.set(gen.id, gen);
    generations.value = next;
    selectGeneration(gen);
  }

  function updateGeneration(id: string, partial: Partial<Generation>): void {
    const existing = generations.value.get(id);
    if (existing) {
      const next = new Map(generations.value);
      next.set(id, { ...existing, ...partial });
      generations.value = next;
    }
  }

  function selectGeneration(gen: Generation): void {
    const next = new Map(selectedBySlot.value);
    next.set(slotKey(gen.campaignId, gen.type, gen.platform), gen.id);
    selectedBySlot.value = next;
  }

  function getSelectedGeneration(
    campaignId: string,
    type: Generation['type'],
    platform: string
  ): Generation | undefined {
    const selectedId = selectedBySlot.value.get(slotKey(campaignId, type, platform));
    if (selectedId) return generations.value.get(selectedId);
    return getLatestGeneration(campaignId, type, platform);
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
    const next = new Map(generations.value);
    result.forEach((g) => next.set(g.id, g));
    generations.value = next;
  }

  async function fetchAllHistory(params?: { liked?: boolean; sort?: 'recent' | 'top' }): Promise<Generation[]> {
    const query = new URLSearchParams();
    if (params?.liked !== undefined) query.set('liked', String(params.liked));
    if (params?.sort) query.set('sort', params.sort);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const result = await api.get<Generation[]>(`/history${suffix}`);
    const next = new Map(generations.value);
    result.forEach((g) => next.set(g.id, g));
    generations.value = next;
    return result;
  }

  async function patchGeneration(id: string, patch: GenerationFeedbackPatch): Promise<Generation> {
    const updated = await api.patch<Generation>(`/history/${id}`, patch);
    updateGeneration(id, updated);
    return updated;
  }

  async function fetchLineage(id: string): Promise<Generation[]> {
    const result = await api.get<Generation[]>(`/history/lineage/${id}`);
    const next = new Map(generations.value);
    result.forEach((g) => next.set(g.id, g));
    generations.value = next;
    return result;
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
    generations.value = new Map();
    selectedBySlot.value = new Map();
  }

  return {
    generations,
    selectedBySlot,
    setGeneration,
    updateGeneration,
    selectGeneration,
    getSelectedGeneration,
    getGenerationsForCampaign,
    getLatestGeneration,
    fetchHistory,
    fetchAllHistory,
    patchGeneration,
    fetchLineage,
    startVideoSSE,
    closeSSE,
    clearAll,
  };
});
