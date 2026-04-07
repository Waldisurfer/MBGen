import { createRouter, createWebHistory } from 'vue-router';
import { useCampaignStore } from '@/stores/campaign.store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    {
      path: '/dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/campaign/new',
      component: () => import('@/views/CampaignView.vue'),
    },
    {
      path: '/campaign/:id/generate',
      component: () => import('@/views/GenerateView.vue'),
      meta: { requiresCampaign: true },
    },
    {
      path: '/campaign/:id/preview',
      component: () => import('@/views/PreviewView.vue'),
      meta: { requiresCampaign: true },
    },
    {
      path: '/images',
      component: () => import('@/views/ImageStudioView.vue'),
    },
    {
      path: '/banner',
      component: () => import('@/views/BannerStudioView.vue'),
    },
    {
      path: '/import',
      component: () => import('@/views/StrategyImportView.vue'),
    },
    {
      path: '/history',
      component: () => import('@/views/HistoryView.vue'),
    },
    {
      path: '/settings',
      component: () => import('@/views/SettingsView.vue'),
    },
  ],
});

router.beforeEach(async (to) => {
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
