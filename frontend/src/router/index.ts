import { createRouter, createWebHistory } from 'vue-router';
import { useCampaignStore } from '@/stores/campaign.store';
import { useAuthStore } from '@/stores/auth.store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { requiresAuth: false } },
    { path: '/reset-password', component: () => import('@/views/ResetPasswordView.vue'), meta: { requiresAuth: false } },
    { path: '/dashboard', component: () => import('@/views/DashboardView.vue'), meta: { requiresAuth: true } },
    { path: '/campaign/new', component: () => import('@/views/CampaignView.vue'), meta: { requiresAuth: true } },
    { path: '/campaign/:id/generate', component: () => import('@/views/GenerateView.vue'), meta: { requiresAuth: true, requiresCampaign: true } },
    { path: '/campaign/:id/preview', component: () => import('@/views/PreviewView.vue'), meta: { requiresAuth: true, requiresCampaign: true } },
    { path: '/images', component: () => import('@/views/ImageStudioView.vue'), meta: { requiresAuth: true } },
    { path: '/banner', component: () => import('@/views/BannerStudioView.vue'), meta: { requiresAuth: true } },
    { path: '/import', component: () => import('@/views/StrategyImportView.vue'), meta: { requiresAuth: true } },
    { path: '/history', component: () => import('@/views/HistoryView.vue'), meta: { requiresAuth: true } },
    { path: '/settings', component: () => import('@/views/SettingsView.vue'), meta: { requiresAuth: true } },
    { path: '/admin', component: () => import('@/views/AdminView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Wait for initial auth check
  if (auth.isLoading) {
    await auth.init();
  }

  if (to.meta.requiresAuth !== false && !auth.isAuthenticated) {
    return '/login';
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return '/dashboard';
  }

  if (to.meta.requiresCampaign) {
    const store = useCampaignStore();
    const campaignId = to.params.id as string;
    if (!store.currentCampaign || store.currentCampaign.id !== campaignId) {
      try {
        await store.fetchCampaign(campaignId);
      } catch {
        return '/dashboard';
      }
    }
  }
});

export default router;
