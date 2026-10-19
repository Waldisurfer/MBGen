<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router';
import { useUiStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useCampaignStore } from '@/stores/campaign.store';
import { useGenerationStore } from '@/stores/generation.store';
import { api } from '@/lib/api';

const route           = useRoute();
const router          = useRouter();
const ui              = useUiStore();
const auth            = useAuthStore();
const campaignStore   = useCampaignStore();
const generationStore = useGenerationStore();

interface HealthServices {
  anthropic: boolean;
  replicate: boolean;
  googleAiStudio: boolean;
  googleVertexAi: boolean;
  r2: boolean;
  database: boolean;
}
const services = ref<HealthServices | null>(null);

onMounted(async () => {
  await auth.init();
  try {
    const h = await api.get<{ services: HealthServices }>('/health');
    services.value = h.services;
  } catch { /* backend unreachable — no dots shown */ }
});

const showSidebar = computed(() => route.path !== '/login');

const navLinks = [
  { to: '/dashboard',    label: 'Dashboard',       requires: [] as string[],              icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/campaign/new', label: 'New Campaign',     requires: ['anthropic', 'database'],   icon: 'M12 4v16m8-8H4' },
  { to: '/images',       label: 'Image Studio',     requires: ['replicate'],               icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
  { to: '/banner',       label: 'Banner Studio',    requires: ['anthropic'],               icon: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-12m12-13.5v13.5M6 20.25h12M8.25 20.25v-4.5m7.5 4.5v-4.5' },
  { to: '/import',       label: 'Import Strategy',  requires: ['anthropic'],               icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
  { to: '/history',      label: 'History',          requires: ['database'],                icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/settings',     label: 'Settings',         requires: [] as string[],              icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

function dotStatus(requires: string[]): 'active' | 'inactive' | null {
  if (!services.value || requires.length === 0) return null;
  const s = services.value as Record<string, boolean>;
  // googleAiStudio or googleVertexAi satisfy a 'google' requirement
  const resolve = (key: string) => key === 'google'
    ? (s.googleAiStudio || s.googleVertexAi)
    : s[key];
  return requires.every(resolve) ? 'active' : 'inactive';
}

async function logout() {
  await auth.signOut();
  campaignStore.campaigns = [];
  campaignStore.clearCurrent();
  generationStore.clearAll();
  router.push('/login');
}
</script>

<template>
  <div class="min-h-screen flex">

    <!-- Sidebar (hidden on login page) -->
    <aside v-if="showSidebar" class="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div class="px-5 py-5 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5M2 17l8 5 8-5" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <span class="font-bold text-gray-900 text-sm">MBGen</span>
        </div>
        <p class="text-xs text-gray-400 mt-0.5 pl-9">Studio</p>
      </div>

      <nav class="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          :class="[
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
            route.path === link.to || route.path.startsWith(link.to + '/')
              ? 'bg-brand-50 text-brand-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          ]"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="link.icon" />
          </svg>
          {{ link.label }}
          <span
            v-if="dotStatus(link.requires) !== null"
            class="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
            :class="dotStatus(link.requires) === 'active' ? 'bg-green-500' : 'bg-gray-300'"
            :title="dotStatus(link.requires) === 'active' ? 'All services active' : 'Some services not configured'"
          />
        </RouterLink>

        <!-- Admin link (admin only) -->
        <RouterLink
          v-if="auth.isAdmin"
          to="/admin"
          :class="[
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
            route.path === '/admin' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          ]"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Admin
        </RouterLink>
      </nav>

      <!-- Spend bar + user info -->
      <div v-if="auth.isAuthenticated" class="px-4 py-4 border-t border-gray-100 space-y-3">

        <!-- Spend bar (hidden for admins) -->
        <div v-if="!auth.isAdmin">
          <div class="flex items-center justify-between mb-1">
            <p class="text-xs text-gray-400">Monthly spend</p>
            <p class="text-xs font-mono" :class="auth.atLimit ? 'text-red-500' : auth.spendPercent >= 80 ? 'text-amber-500' : 'text-gray-400'">
              ${{ auth.monthlySpend.toFixed(4) }}
            </p>
          </div>
          <div class="h-1 bg-gray-100 rounded-full">
            <div
              class="h-full rounded-full transition-all"
              :class="auth.atLimit ? 'bg-red-500' : auth.spendPercent >= 80 ? 'bg-amber-500' : 'bg-brand-600'"
              :style="{ width: `${auth.spendPercent}%` }"
            />
          </div>
          <p v-if="auth.atLimit" class="text-xs text-red-500 mt-1">Limit reached · resets next month</p>
        </div>
        <div v-else class="flex items-center gap-1.5">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">Admin</span>
          <span class="text-xs text-gray-400">Unlimited</span>
        </div>

        <!-- Logout -->
        <button
          class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          @click="logout"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 min-w-0 overflow-auto">
      <RouterView />
    </main>

    <!-- Toast notifications -->
    <div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      <TransitionGroup name="toast">
        <div
          v-for="toast in ui.toasts"
          :key="toast.id"
          :class="[
            'px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white max-w-sm',
            toast.type === 'success' && 'bg-green-600',
            toast.type === 'error' && 'bg-red-600',
            toast.type === 'info' && 'bg-gray-800',
          ]"
        >
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
