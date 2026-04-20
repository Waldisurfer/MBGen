import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Brand, BrandFormData } from '@/types/campaign.types';
import { api } from '@/lib/api';

export const useBrandStore = defineStore('brand', () => {
  const brands = ref<Brand[]>([]);
  const isLoading = ref(false);

  // First brand is the most recently used (backend orders by lastUsedAt DESC NULLS LAST)
  const latestBrand = computed(() => brands.value[0] ?? null);

  async function fetchBrands(): Promise<void> {
    isLoading.value = true;
    try {
      brands.value = await api.get<Brand[]>('/brands');
    } finally {
      isLoading.value = false;
    }
  }

  async function createBrand(data: BrandFormData): Promise<Brand> {
    const brand = await api.post<Brand>('/brands', data);
    brands.value.unshift(brand);
    return brand;
  }

  async function updateBrand(id: string, data: BrandFormData): Promise<Brand> {
    const brand = await api.put<Brand>(`/brands/${id}`, data);
    const idx = brands.value.findIndex(b => b.id === id);
    if (idx !== -1) brands.value[idx] = brand;
    return brand;
  }

  async function deleteBrand(id: string): Promise<void> {
    await api.delete(`/brands/${id}`);
    brands.value = brands.value.filter(b => b.id !== id);
  }

  async function markUsed(id: string): Promise<void> {
    await api.post(`/brands/${id}/use`);
    // Move to front (most recently used)
    const idx = brands.value.findIndex(b => b.id === id);
    if (idx > 0) {
      const [brand] = brands.value.splice(idx, 1);
      brands.value.unshift({ ...brand, lastUsedAt: new Date().toISOString() });
    }
  }

  return {
    brands,
    isLoading,
    latestBrand,
    fetchBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    markUsed,
  };
});
