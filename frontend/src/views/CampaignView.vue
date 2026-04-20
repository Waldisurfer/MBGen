<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import Button from '@/components/ui/Button.vue';
import BrandSelector from '@/components/ui/BrandSelector.vue';
import AudienceSelector from '@/components/ui/AudienceSelector.vue';
import StrategyForm from '@/components/campaign/StrategyForm.vue';
import InspirationUpload from '@/components/campaign/InspirationUpload.vue';
import { useCampaignStore } from '@/stores/campaign.store';
import { useUiStore } from '@/stores/ui.store';
import type { Brand, Audience, AudienceData, BrandData } from '@/types/campaign.types';

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

// Step 1: strategy
const formName = ref('');
const formStrategy = ref('');

// Step 2: audience (pick from library or create inline)
const selectedAudience = ref<Audience | null>(null);
const createNewAudience = ref(false);
const inlineAudience = reactive<AudienceData>({
  demographics: '',
  psychographics: '',
  painPoints: '',
  channels: [],
});
const CHANNELS = ['instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'linkedin'] as const;

function toggleChannel(ch: string) {
  const idx = inlineAudience.channels.indexOf(ch);
  if (idx === -1) inlineAudience.channels.push(ch);
  else inlineAudience.channels.splice(idx, 1);
}

// Step 3: brand (pick from library or create inline)
const selectedBrand = ref<Brand | null>(null);
const createNewBrand = ref(false);
const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly & Approachable' },
  { value: 'bold', label: 'Bold & Confident' },
  { value: 'playful', label: 'Playful & Fun' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'urgent', label: 'Urgent & Direct' },
];
const inlineBrand = reactive<BrandData>({ name: '', tone: '', colors: [], fonts: [] });
const colorInput = ref('#000000');
const fontInput = ref('');

function addColor() {
  if (!colorInput.value || inlineBrand.colors.includes(colorInput.value)) return;
  inlineBrand.colors.push(colorInput.value);
}
function removeColor(c: string) { inlineBrand.colors = inlineBrand.colors.filter(x => x !== c); }
function addFont() {
  const f = fontInput.value.trim();
  if (!f || inlineBrand.fonts.includes(f)) return;
  inlineBrand.fonts.push(f);
  fontInput.value = '';
}
function removeFont(f: string) { inlineBrand.fonts = inlineBrand.fonts.filter(x => x !== f); }

// Step 4: inspiration
const inspirationKeys = ref<string[]>([]);

const canNext = computed(() => {
  if (step.value === 1) return formName.value.trim().length > 0 && formStrategy.value.trim().length >= 10;
  if (step.value === 2) {
    if (createNewAudience.value) {
      return !!inlineAudience.demographics && !!inlineAudience.psychographics && !!inlineAudience.painPoints && inlineAudience.channels.length > 0;
    }
    return !!selectedAudience.value;
  }
  if (step.value === 3) {
    if (createNewBrand.value) return !!inlineBrand.name && !!inlineBrand.tone;
    return !!selectedBrand.value;
  }
  return true;
});

function next() {
  if (step.value < 4 && canNext.value) step.value++;
}

function prev() {
  if (step.value > 1) step.value--;
}

async function submit() {
  if (!canNext.value) return;
  isSubmitting.value = true;
  try {
    const payload: Parameters<typeof campaignStore.createCampaign>[0] = {
      name: formName.value,
      strategy: formStrategy.value,
      inspirationKeys: inspirationKeys.value,
    };

    if (createNewAudience.value) {
      payload.audience = { ...inlineAudience };
    } else {
      payload.audienceId = selectedAudience.value!.id;
    }

    if (createNewBrand.value) {
      payload.brand = { ...inlineBrand };
    } else {
      payload.brandId = selectedBrand.value!.id;
    }

    const campaign = await campaignStore.createCampaign(payload);
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
          <div v-for="(s, i) in STEPS" :key="i" class="flex items-center">
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

        <!-- Step 1: Strategy -->
        <StrategyForm
          v-if="step === 1"
          :name="formName"
          :strategy="formStrategy"
          @update:name="formName = $event"
          @update:strategy="formStrategy = $event"
        />

        <!-- Step 2: Audience -->
        <div v-else-if="step === 2" class="flex flex-col gap-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-1">Target audience</h2>
            <p class="text-sm text-gray-500">Pick a saved audience or create a new one.</p>
          </div>

          <div v-if="!createNewAudience">
            <label class="text-sm font-medium text-gray-700 block mb-2">Saved audiences</label>
            <AudienceSelector v-model="selectedAudience" />
            <button
              type="button"
              class="mt-3 text-xs text-brand-600 hover:underline"
              @click="createNewAudience = true; selectedAudience = null"
            >
              + Create new audience instead
            </button>
          </div>

          <div v-else class="space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-700">New audience</p>
              <button
                type="button"
                class="text-xs text-gray-400 hover:text-gray-700"
                @click="createNewAudience = false"
              >
                ← Back to saved
              </button>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Demographics</label>
              <textarea
                v-model="inlineAudience.demographics"
                rows="2"
                placeholder="Age range, location, gender, income level..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Psychographics & interests</label>
              <textarea
                v-model="inlineAudience.psychographics"
                rows="2"
                placeholder="Values, lifestyle, hobbies, motivations..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Pain points & needs</label>
              <textarea
                v-model="inlineAudience.painPoints"
                rows="2"
                placeholder="What problems does your audience face?"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">Target platforms</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="channel in CHANNELS" :key="channel"
                  type="button"
                  :class="[
                    'px-3 py-1.5 text-sm rounded-full border transition-all capitalize',
                    inlineAudience.channels.includes(channel)
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-brand-400',
                  ]"
                  @click="toggleChannel(channel)"
                >{{ channel }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Brand -->
        <div v-else-if="step === 3" class="flex flex-col gap-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-1">Brand</h2>
            <p class="text-sm text-gray-500">Pick a saved brand or define a new one.</p>
          </div>

          <div v-if="!createNewBrand">
            <label class="text-sm font-medium text-gray-700 block mb-2">Saved brands</label>
            <BrandSelector v-model="selectedBrand" />
            <button
              type="button"
              class="mt-3 text-xs text-brand-600 hover:underline"
              @click="createNewBrand = true; selectedBrand = null"
            >
              + Create new brand instead
            </button>
          </div>

          <div v-else class="space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-700">New brand</p>
              <button
                type="button"
                class="text-xs text-gray-400 hover:text-gray-700"
                @click="createNewBrand = false"
              >
                ← Back to saved
              </button>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Brand name</label>
              <input
                v-model="inlineBrand.name"
                type="text"
                placeholder="e.g. Acme Corp"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Brand tone</label>
              <select
                v-model="inlineBrand.tone"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="" disabled>Select tone</option>
                <option v-for="opt in TONE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>

            <!-- Colors -->
            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">Brand colors</p>
              <div class="flex items-center gap-2 mb-2">
                <input v-model="colorInput" type="color" class="w-10 h-9 rounded border border-gray-300 cursor-pointer p-0.5" />
                <button type="button" class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg" @click="addColor">Add color</button>
              </div>
              <div class="flex flex-wrap gap-2">
                <div v-for="color in inlineBrand.colors" :key="color" class="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-full text-xs">
                  <div class="w-4 h-4 rounded-full border border-gray-200" :style="{ background: color }" />
                  <span>{{ color }}</span>
                  <button type="button" class="text-gray-400 hover:text-gray-600" @click="removeColor(color)">×</button>
                </div>
              </div>
            </div>

            <!-- Fonts -->
            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">Brand fonts</p>
              <div class="flex items-center gap-2 mb-2">
                <input
                  v-model="fontInput" type="text"
                  placeholder="e.g. Inter, Helvetica Neue"
                  class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  @keydown.enter.prevent="addFont"
                />
                <button type="button" class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg" @click="addFont">Add</button>
              </div>
              <div class="flex flex-wrap gap-2">
                <div v-for="font in inlineBrand.fonts" :key="font" class="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs">
                  {{ font }}
                  <button type="button" class="text-gray-400 hover:text-gray-600" @click="removeFont(font)">×</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Inspiration -->
        <InspirationUpload
          v-else-if="step === 4"
          @update:keys="inspirationKeys = $event"
        />
      </form>
    </div>

    <!-- Footer nav -->
    <div class="px-8 py-5 border-t border-gray-200 bg-white max-w-2xl">
      <div class="flex items-center justify-between">
        <Button variant="ghost" :disabled="step === 1" @click="prev">Back</Button>

        <div class="flex items-center gap-3">
          <button
            class="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            @click="router.push('/banner')"
          >
            Skip — go to Banner Studio
          </button>

          <Button v-if="step < 4" :disabled="!canNext" @click="next">Continue</Button>
          <Button v-else :loading="isSubmitting" @click="submit">Create Campaign</Button>
        </div>
      </div>
    </div>
  </div>
</template>
