<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import Button from '@/components/ui/Button.vue';
import StrategyForm from '@/components/campaign/StrategyForm.vue';
import AudienceForm from '@/components/campaign/AudienceForm.vue';
import BrandForm from '@/components/campaign/BrandForm.vue';
import InspirationUpload from '@/components/campaign/InspirationUpload.vue';
import { useCampaignStore } from '@/stores/campaign.store';
import { useUiStore } from '@/stores/ui.store';
import type { CampaignFormData, AudienceData, BrandData } from '@/types/campaign.types';

const router = useRouter();
const campaignStore = useCampaignStore();
const ui = useUiStore();

const STEPS = [
  { label: 'Strategy', description: 'Goals & messaging' },
  { label: 'Audience', description: 'Who to target' },
  { label: 'Brand', description: 'Visual identity' },
  { label: 'Inspiration', description: 'Reference images' },
];

const step = ref(1);
const isSubmitting = ref(false);

const form = reactive<CampaignFormData>({
  name: '',
  strategy: '',
  audience: {
    demographics: '',
    psychographics: '',
    painPoints: '',
    channels: [],
  } as AudienceData,
  brand: {
    name: '',
    tone: '',
    colors: [],
    fonts: [],
  } as BrandData,
  inspirationKeys: [],
});

function canNext(): boolean {
  if (step.value === 1) return form.name.trim().length > 0 && form.strategy.trim().length >= 10;
  if (step.value === 2) {
    const a = form.audience;
    return !!a.demographics && !!a.psychographics && !!a.painPoints && a.channels.length > 0;
  }
  if (step.value === 3) return !!form.brand.name && !!form.brand.tone;
  return true;
}

function next() {
  if (step.value < 4 && canNext()) step.value++;
}

function prev() {
  if (step.value > 1) step.value--;
}

async function submit() {
  if (!canNext()) return;
  isSubmitting.value = true;

  try {
    const campaign = await campaignStore.createCampaign(form);
    ui.showToast('Campaign created! Generating content...', 'success');
    router.push(`/campaign/${campaign.id}/generate`);
  } catch (err) {
    ui.showToast((err as Error).message ?? 'Failed to create campaign', 'error');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-full flex flex-col">
    <!-- Header -->
    <div class="px-8 py-5 border-b border-gray-200 bg-white">
      <div class="flex items-center justify-between max-w-2xl">
        <div>
          <h1 class="text-xl font-bold text-gray-900">New Campaign</h1>
          <p class="text-sm text-gray-500 mt-0.5">Step {{ step }} of {{ STEPS.length }}</p>
        </div>

        <!-- Step indicators -->
        <div class="flex items-center gap-1">
          <div
            v-for="(s, i) in STEPS"
            :key="i"
            class="flex items-center"
          >
            <div
              :class="[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                step > i + 1 ? 'bg-brand-600 text-white' :
                step === i + 1 ? 'bg-brand-600 text-white ring-2 ring-brand-200' :
                'bg-gray-200 text-gray-500',
              ]"
            >
              <svg v-if="step > i + 1" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <div v-if="i < STEPS.length - 1" class="w-6 h-px bg-gray-300 mx-1" />
          </div>
        </div>
      </div>
    </div>

    <!-- Form area -->
    <div class="flex-1 px-8 py-8 max-w-2xl">
      <form @submit.prevent>
        <StrategyForm
          v-if="step === 1"
          :name="form.name"
          :strategy="form.strategy"
          @update:name="form.name = $event"
          @update:strategy="form.strategy = $event"
        />

        <AudienceForm
          v-else-if="step === 2"
          :model-value="form.audience"
          @update:model-value="form.audience = $event"
        />

        <BrandForm
          v-else-if="step === 3"
          :model-value="form.brand"
          @update:model-value="form.brand = $event"
        />

        <InspirationUpload
          v-else-if="step === 4"
          @update:keys="form.inspirationKeys = $event"
        />
      </form>
    </div>

    <!-- Footer nav -->
    <div class="px-8 py-5 border-t border-gray-200 bg-white max-w-2xl">
      <div class="flex items-center justify-between">
        <Button
          variant="ghost"
          :disabled="step === 1"
          @click="prev"
        >
          Back
        </Button>

        <div class="flex items-center gap-3">
          <button
            class="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            @click="router.push('/banner')"
          >
            Skip — go to Banner Studio
          </button>

          <Button
            v-if="step < 4"
            :disabled="!canNext()"
            @click="next"
          >
            Continue
          </Button>

          <Button
            v-else
            :loading="isSubmitting"
            @click="submit"
          >
            Create Campaign
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
