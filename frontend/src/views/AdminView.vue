<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/lib/api';

interface UserRow {
  id: string;
  userId: string;
  role: string;
  monthlySpendUsd: number;
  monthlyLimitUsd: number;
  spendPercent: number;
  monthlyResetAt: string;
  createdAt: string;
}

const users    = ref<UserRow[]>([]);
const loading  = ref(true);
const resetting = ref<string | null>(null);

const totalSpend = computed(() =>
  users.value.reduce((sum, u) => sum + u.monthlySpendUsd, 0)
);

async function load() {
  loading.value = true;
  try {
    users.value = await api.get<UserRow[]>('/admin/users');
  } finally {
    loading.value = false;
  }
}

async function resetSpend(id: string) {
  resetting.value = id;
  await api.post(`/admin/users/${id}/reset-spend`);
  await load();
  resetting.value = null;
}

async function toggleRole(user: UserRow) {
  const newRole = user.role === 'admin' ? 'user' : 'admin';
  await api.post(`/admin/users/${user.id}/role`, { role: newRole });
  await load();
}

onMounted(load);
</script>

<template>
  <div class="p-8 max-w-5xl mx-auto">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-gray-900">Admin Panel</h1>
      <p class="text-sm text-gray-500 mt-1">Manage users and API spending limits</p>
    </div>

    <!-- Summary card -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 mb-1">Total users</p>
        <p class="text-2xl font-bold text-gray-900">{{ users.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 mb-1">Total spend this month</p>
        <p class="text-2xl font-bold text-gray-900">${{ totalSpend.toFixed(4) }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 mb-1">Per-user monthly limit</p>
        <p class="text-2xl font-bold text-gray-900">$0.10</p>
      </div>
    </div>

    <!-- Users table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100">
        <p class="text-sm font-semibold text-gray-900">Users</p>
      </div>

      <div v-if="loading" class="p-8 text-center text-sm text-gray-400">Loading…</div>

      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">User ID</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly spend</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Usage</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-b border-gray-50 last:border-0">
            <td class="px-5 py-3">
              <span class="font-mono text-xs text-gray-500">{{ u.userId.slice(0, 8) }}…</span>
            </td>
            <td class="px-5 py-3">
              <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', u.role === 'admin' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600']">
                {{ u.role }}
              </span>
            </td>
            <td class="px-5 py-3 font-mono text-xs">
              ${{ u.monthlySpendUsd.toFixed(4) }}
            </td>
            <td class="px-5 py-3 w-40">
              <div v-if="u.role !== 'admin'">
                <div class="h-1.5 bg-gray-100 rounded-full w-32">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="u.spendPercent >= 100 ? 'bg-red-500' : u.spendPercent >= 80 ? 'bg-amber-500' : 'bg-brand-600'"
                    :style="{ width: `${Math.min(100, u.spendPercent)}%` }"
                  />
                </div>
                <p class="text-xs text-gray-400 mt-0.5">{{ u.spendPercent }}%</p>
              </div>
              <span v-else class="text-xs text-gray-400">Unlimited</span>
            </td>
            <td class="px-5 py-3">
              <div class="flex items-center gap-2 justify-end">
                <button
                  v-if="u.role !== 'admin'"
                  class="text-xs text-gray-500 hover:text-brand-600 transition-colors"
                  :disabled="resetting === u.id"
                  @click="resetSpend(u.id)"
                >
                  {{ resetting === u.id ? 'Resetting…' : 'Reset spend' }}
                </button>
                <button
                  class="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                  @click="toggleRole(u)"
                >
                  {{ u.role === 'admin' ? 'Revoke admin' : 'Make admin' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
