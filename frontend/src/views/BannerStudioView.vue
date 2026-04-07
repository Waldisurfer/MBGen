<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import html2canvas from 'html2canvas';
import Button from '@/components/ui/Button.vue';

// ─── Data ────────────────────────────────────────────────────────────────────

const GRADIENTS = [
  { id: 'royal',    name: 'Royal',       css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',           dark: false },
  { id: 'sunset',   name: 'Sunset',      css: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',           dark: false },
  { id: 'ocean',    name: 'Ocean',       css: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',           dark: false },
  { id: 'fire',     name: 'Fire',        css: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',           dark: false },
  { id: 'forest',   name: 'Forest',      css: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',           dark: true  },
  { id: 'midnight', name: 'Midnight',    css: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',           dark: false },
  { id: 'rose',     name: 'Rose',        css: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',           dark: false },
  { id: 'sage',     name: 'Sage',        css: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',           dark: false },
  { id: 'gold',     name: 'Gold',        css: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',           dark: true  },
  { id: 'carbon',   name: 'Carbon',      css: 'linear-gradient(135deg, #1c1c1c 0%, #434343 100%)',           dark: false },
  { id: 'aurora',   name: 'Aurora',      css: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',           dark: true  },
  { id: 'deep',     name: 'Deep Night',  css: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', dark: false },
  { id: 'peach',    name: 'Peach',       css: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',           dark: true  },
  { id: 'spring',   name: 'Spring',      css: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',           dark: true  },
  { id: 'wine',     name: 'Wine',        css: 'linear-gradient(135deg, #4a0000 0%, #8b0000 100%)',           dark: false },
  { id: 'ice',      name: 'Ice',         css: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',           dark: true  },
];

const FONT_PAIRS = [
  { id: 'modern',  name: 'Modern',   heading: 'Montserrat',         body: 'Open Sans',            weight: 700 },
  { id: 'elegant', name: 'Elegant',  heading: 'Playfair Display',   body: 'Lato',                 weight: 700 },
  { id: 'impact',  name: 'Impact',   heading: 'Oswald',             body: 'Source Sans 3',        weight: 600 },
  { id: 'minimal', name: 'Minimal',  heading: 'Poppins',            body: 'Poppins',              weight: 600 },
  { id: 'luxe',    name: 'Luxe',     heading: 'Cormorant Garamond', body: 'Montserrat',           weight: 600 },
  { id: 'dynamic', name: 'Dynamic',  heading: 'Raleway',            body: 'Roboto',               weight: 800 },
];

const SIZES = [
  { id: 'square',    name: 'Instagram Post',  ratio: '1 / 1',   label: '1080 × 1080' },
  { id: 'story',     name: 'Story / Reel',    ratio: '9 / 16',  label: '1080 × 1920' },
  { id: 'landscape', name: 'Facebook / X',    ratio: '16 / 9',  label: '1200 × 628'  },
  { id: 'linkedin',  name: 'LinkedIn Banner', ratio: '4 / 1',   label: '1584 × 396'  },
  { id: 'rectangle', name: 'Display Ad',      ratio: '6 / 5',   label: '300 × 250'   },
];

const POSITIONS = [
  { id: 'center',       label: 'Center',        flex: 'items-center justify-center', textAlign: 'center' },
  { id: 'bottom-left',  label: 'Bottom left',   flex: 'items-end justify-start',     textAlign: 'left'   },
  { id: 'bottom-center',label: 'Bottom center', flex: 'items-end justify-center',    textAlign: 'center' },
  { id: 'top-left',     label: 'Top left',      flex: 'items-start justify-start',   textAlign: 'left'   },
];

const PRESETS = [
  { label: '🚀 Launch',  headline: 'Launch Your Vision',          sub: 'Built for the bold. Ready for growth.',       cta: 'Start Free'       },
  { label: '🛍 Sale',    headline: 'Exclusive Offer',             sub: 'Limited time — save up to 50% today',         cta: 'Shop Now'         },
  { label: '🌿 Brand',   headline: 'Crafted with Purpose',        sub: 'Sustainable. Conscious. Beautiful.',          cta: 'Discover More'    },
  { label: '📱 App',     headline: 'The App That Changes Things', sub: 'Join 100,000+ users already on board',        cta: 'Download Free'    },
  { label: '🎯 Event',   headline: "You're Invited",              sub: 'Join us for an exclusive experience',         cta: 'Reserve Your Spot'},
  { label: '💎 Premium', headline: 'Premium. Redefined.',         sub: 'Uncompromising quality for those who know.',  cta: 'Explore'          },
];

// ─── State ────────────────────────────────────────────────────────────────────

const headline    = ref('Transform Your Business');
const subheadline = ref('Powerful solutions for modern challenges');
const ctaText     = ref('Get Started Today');
const showSub     = ref(true);
const showCta     = ref(true);

const selectedGradient = ref('royal');
const selectedFont     = ref('modern');
const selectedSize     = ref('square');
const selectedPosition = ref('center');
const textColorMode    = ref<'auto' | 'light' | 'dark'>('auto');
const headlineSizePx   = ref(48);
const subSizePx        = ref(20);

const isExporting = ref(false);
const bannerRef   = ref<HTMLElement | null>(null);

// ─── Computed ─────────────────────────────────────────────────────────────────

const activeGradient = computed(() => GRADIENTS.find(g => g.id === selectedGradient.value)!);
const activeFont     = computed(() => FONT_PAIRS.find(f => f.id === selectedFont.value)!);
const activeSize     = computed(() => SIZES.find(s => s.id === selectedSize.value)!);
const activePosition = computed(() => POSITIONS.find(p => p.id === selectedPosition.value)!);

const lightText = computed(() => {
  if (textColorMode.value === 'light') return true;
  if (textColorMode.value === 'dark')  return false;
  return !activeGradient.value.dark;
});

const textColor  = computed(() => lightText.value ? '#ffffff'           : '#1a1a1a');
const ctaBg      = computed(() => lightText.value ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)');
const ctaBorder  = computed(() => lightText.value ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.22)');
const textShadow = computed(() => lightText.value ? '0 1px 6px rgba(0,0,0,0.4)' : '0 1px 4px rgba(255,255,255,0.3)');

// Banner outer container — preview width adapts to aspect ratio
// We cap the preview at 400px tall and derive the width from ratio
const previewStyle = computed(() => {
  const [w, h] = activeSize.value.ratio.split('/').map(s => parseFloat(s.trim()));
  const maxH = selectedSize.value === 'linkedin' ? 160 : 420;
  const maxW = 420;
  const byH = maxH * (w / h);
  const width = Math.min(byH, maxW);
  return { width: `${width}px`, aspectRatio: activeSize.value.ratio };
});

const bannerBg = computed(() => ({ background: activeGradient.value.css }));

const positionClasses = computed(() =>
  `flex flex-col gap-3 p-8 ${activePosition.value.flex}`
);

const headlineStyle = computed(() => ({
  fontFamily: `'${activeFont.value.heading}', sans-serif`,
  fontWeight: activeFont.value.weight,
  fontSize:   `${headlineSizePx.value}px`,
  lineHeight:  '1.1',
  color:       textColor.value,
  textShadow:  textShadow.value,
  textAlign:   activePosition.value.textAlign as CanvasTextAlign,
  letterSpacing: selectedFont.value === 'impact' ? '0.02em' : '-0.01em',
}));

const subStyle = computed(() => ({
  fontFamily: `'${activeFont.value.body}', sans-serif`,
  fontWeight:  400,
  fontSize:   `${subSizePx.value}px`,
  lineHeight:  '1.5',
  color:       textColor.value,
  textShadow:  textShadow.value,
  textAlign:   activePosition.value.textAlign as CanvasTextAlign,
  opacity:     0.88,
}));

const ctaStyle = computed(() => ({
  display:       'inline-block',
  fontFamily:    `'${activeFont.value.body}', sans-serif`,
  fontWeight:    600,
  fontSize:      `${Math.round(subSizePx.value * 0.85)}px`,
  color:         textColor.value,
  background:    ctaBg.value,
  border:        `1.5px solid ${ctaBorder.value}`,
  borderRadius:  '9999px',
  padding:       '10px 24px',
  letterSpacing: '0.03em',
  textTransform: 'uppercase' as const,
  alignSelf:     activePosition.value.textAlign === 'center' ? 'center' : 'flex-start',
  marginTop:     '4px',
}));

// ─── Font loading ─────────────────────────────────────────────────────────────

onMounted(() => {
  if (document.querySelector('link[data-banner-fonts]')) return;
  const families = [
    'Montserrat:wght@600;700;800',
    'Open+Sans:wght@400;600',
    'Playfair+Display:ital,wght@0,400;0,700;1,400',
    'Lato:wght@400;700',
    'Oswald:wght@400;600',
    'Source+Sans+3:wght@400;600',
    'Poppins:wght@400;500;600;700',
    'Cormorant+Garamond:ital,wght@0,400;0,600;1,400',
    'Raleway:wght@400;700;800',
    'Roboto:wght@400;700',
  ];
  const url = `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.dataset.bannerFonts = '1';
  document.head.appendChild(link);
});

// ─── Actions ──────────────────────────────────────────────────────────────────

async function handleExport() {
  if (!bannerRef.value || isExporting.value) return;
  isExporting.value = true;
  try {
    await document.fonts.ready;
    const canvas = await html2canvas(bannerRef.value, {
      scale:           3,
      useCORS:         true,
      allowTaint:      true,
      backgroundColor: null,
      logging:         false,
    });
    const link = document.createElement('a');
    link.download = `banner-${selectedSize.value}-${selectedGradient.value}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    isExporting.value = false;
  }
}

function applyPreset(p: (typeof PRESETS)[number]) {
  headline.value    = p.headline;
  subheadline.value = p.sub;
  ctaText.value     = p.cta;
  showSub.value     = true;
  showCta.value     = true;
}
</script>

<template>
  <div class="flex h-full min-h-screen">
    <!-- ── Left panel: controls ────────────────────────────────────────────── -->
    <aside class="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
      <div class="px-5 py-5 border-b border-gray-100">
        <h1 class="text-sm font-semibold text-gray-900">Banner Studio</h1>
        <p class="text-xs text-gray-400 mt-0.5">No API keys needed — pure CSS + export</p>
      </div>

      <div class="flex-1 px-5 py-5 space-y-6">

        <!-- Quick presets -->
        <section>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Quick fill</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="p in PRESETS"
              :key="p.label"
              class="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              @click="applyPreset(p)"
            >
              {{ p.label }}
            </button>
          </div>
        </section>

        <!-- Text content -->
        <section class="space-y-3">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Text</p>

          <div>
            <label class="text-xs text-gray-500 mb-1 block">Headline</label>
            <textarea
              v-model="headline"
              rows="2"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs text-gray-500">Subheadline</label>
              <button
                class="text-xs"
                :class="showSub ? 'text-brand-600' : 'text-gray-300'"
                @click="showSub = !showSub"
              >{{ showSub ? 'visible' : 'hidden' }}</button>
            </div>
            <textarea
              v-model="subheadline"
              rows="2"
              :disabled="!showSub"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none disabled:opacity-40"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs text-gray-500">CTA button</label>
              <button
                class="text-xs"
                :class="showCta ? 'text-brand-600' : 'text-gray-300'"
                @click="showCta = !showCta"
              >{{ showCta ? 'visible' : 'hidden' }}</button>
            </div>
            <input
              v-model="ctaText"
              :disabled="!showCta"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-40"
            />
          </div>
        </section>

        <!-- Font size -->
        <section class="space-y-2">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Size</p>
          <div class="flex items-center gap-3">
            <label class="text-xs text-gray-500 w-20 shrink-0">Headline</label>
            <input
              v-model.number="headlineSizePx"
              type="range" min="24" max="96" step="2"
              class="flex-1 accent-brand-600"
            />
            <span class="text-xs text-gray-400 w-8 text-right">{{ headlineSizePx }}</span>
          </div>
          <div class="flex items-center gap-3">
            <label class="text-xs text-gray-500 w-20 shrink-0">Body</label>
            <input
              v-model.number="subSizePx"
              type="range" min="12" max="40" step="1"
              class="flex-1 accent-brand-600"
            />
            <span class="text-xs text-gray-400 w-8 text-right">{{ subSizePx }}</span>
          </div>
        </section>

        <!-- Gradient -->
        <section>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Background</p>
          <div class="grid grid-cols-8 gap-1.5">
            <button
              v-for="g in GRADIENTS"
              :key="g.id"
              :title="g.name"
              :style="{ background: g.css }"
              :class="[
                'w-7 h-7 rounded-lg transition-all',
                selectedGradient === g.id
                  ? 'ring-2 ring-brand-600 ring-offset-1 scale-110'
                  : 'hover:scale-110',
              ]"
              @click="selectedGradient = g.id"
            />
          </div>
        </section>

        <!-- Font pair -->
        <section>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Font</p>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="fp in FONT_PAIRS"
              :key="fp.id"
              :class="[
                'px-3 py-2 rounded-lg text-left transition-colors border text-xs',
                selectedFont === fp.id
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300',
              ]"
              @click="selectedFont = fp.id"
            >
              <span
                :style="{ fontFamily: `'${fp.heading}', sans-serif`, fontWeight: fp.weight }"
                class="block text-sm leading-tight"
              >{{ fp.name }}</span>
              <span class="text-xs opacity-60 mt-0.5 block">{{ fp.heading }}</span>
            </button>
          </div>
        </section>

        <!-- Format / size -->
        <section>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Format</p>
          <div class="space-y-1">
            <button
              v-for="s in SIZES"
              :key="s.id"
              :class="[
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors border',
                selectedSize === s.id
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
              ]"
              @click="selectedSize = s.id"
            >
              <span class="font-medium">{{ s.name }}</span>
              <span class="opacity-60 font-mono">{{ s.label }}</span>
            </button>
          </div>
        </section>

        <!-- Text position -->
        <section>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Text position</p>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="p in POSITIONS"
              :key="p.id"
              :class="[
                'px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                selectedPosition === p.id
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
              ]"
              @click="selectedPosition = p.id"
            >
              {{ p.label }}
            </button>
          </div>
        </section>

        <!-- Text color override -->
        <section>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Text color</p>
          <div class="flex gap-1.5">
            <button
              v-for="opt in (['auto', 'light', 'dark'] as const)"
              :key="opt"
              :class="[
                'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors',
                textColorMode === opt
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
              ]"
              @click="textColorMode = opt"
            >
              {{ opt }}
            </button>
          </div>
        </section>

      </div>
    </aside>

    <!-- ── Right panel: preview + export ──────────────────────────────────── -->
    <main class="flex-1 flex flex-col items-center justify-start pt-10 pb-16 px-8 bg-gray-50 overflow-auto">

      <!-- Export button row -->
      <div class="w-full max-w-2xl flex items-center justify-between mb-6">
        <div>
          <p class="text-sm font-semibold text-gray-900">Preview</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ activeSize.name }} · {{ activeSize.label }}px</p>
        </div>
        <Button :loading="isExporting" @click="handleExport">
          Download PNG
        </Button>
      </div>

      <!-- Banner preview -->
      <div
        class="shadow-2xl rounded-xl overflow-hidden"
        :style="previewStyle"
      >
        <!-- This div is what html2canvas captures -->
        <div
          ref="bannerRef"
          class="relative w-full h-full"
          :style="bannerBg"
        >
          <!-- Text overlay -->
          <div
            class="absolute inset-0 flex flex-col gap-3 p-8"
            :class="activePosition.flex"
          >
            <h1
              :style="headlineStyle"
              style="margin: 0; word-break: break-word;"
            >{{ headline }}</h1>

            <p
              v-if="showSub && subheadline"
              :style="subStyle"
              style="margin: 0;"
            >{{ subheadline }}</p>

            <span
              v-if="showCta && ctaText"
              :style="ctaStyle"
            >{{ ctaText }}</span>
          </div>
        </div>
      </div>

      <!-- Tip -->
      <p class="mt-5 text-xs text-gray-400 text-center max-w-sm">
        Exported PNG is 3× the preview resolution — print and social-ready.
        Fonts load from Google Fonts; ensure internet connection before exporting.
      </p>

    </main>
  </div>
</template>
