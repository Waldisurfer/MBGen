<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import html2canvas from 'html2canvas';
import Button from '@/components/ui/Button.vue';
import { useBannerAI } from '@/composables/useBannerAI';
import type { BannerSuggestions } from '@/composables/useBannerAI';

// ─── Shared data ─────────────────────────────────────────────────────────────

const GRADIENTS = [
  { id: 'royal',    name: 'Royal',       css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',                dark: false },
  { id: 'sunset',   name: 'Sunset',      css: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',                dark: false },
  { id: 'ocean',    name: 'Ocean',       css: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',                dark: false },
  { id: 'fire',     name: 'Fire',        css: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',                dark: false },
  { id: 'forest',   name: 'Forest',      css: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',                dark: true  },
  { id: 'midnight', name: 'Midnight',    css: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',                dark: false },
  { id: 'rose',     name: 'Rose',        css: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',                dark: false },
  { id: 'sage',     name: 'Sage',        css: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',                dark: false },
  { id: 'gold',     name: 'Gold',        css: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',                dark: true  },
  { id: 'carbon',   name: 'Carbon',      css: 'linear-gradient(135deg, #1c1c1c 0%, #434343 100%)',                dark: false },
  { id: 'aurora',   name: 'Aurora',      css: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',                dark: true  },
  { id: 'deep',     name: 'Deep Night',  css: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',  dark: false },
  { id: 'peach',    name: 'Peach',       css: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',                dark: true  },
  { id: 'spring',   name: 'Spring',      css: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',                dark: true  },
  { id: 'wine',     name: 'Wine',        css: 'linear-gradient(135deg, #4a0000 0%, #8b0000 100%)',                dark: false },
  { id: 'ice',      name: 'Ice',         css: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',                dark: true  },
];

const FONT_PAIRS = [
  { id: 'modern',  name: 'Modern',   heading: 'Montserrat',         body: 'Open Sans',     weight: 700 },
  { id: 'elegant', name: 'Elegant',  heading: 'Playfair Display',   body: 'Lato',          weight: 700 },
  { id: 'impact',  name: 'Impact',   heading: 'Oswald',             body: 'Source Sans 3', weight: 600 },
  { id: 'minimal', name: 'Minimal',  heading: 'Poppins',            body: 'Poppins',       weight: 600 },
  { id: 'luxe',    name: 'Luxe',     heading: 'Cormorant Garamond', body: 'Montserrat',    weight: 600 },
  { id: 'dynamic', name: 'Dynamic',  heading: 'Raleway',            body: 'Roboto',        weight: 800 },
];

const SIZES = [
  { id: 'square',    name: 'Instagram Post',  ratio: '1 / 1',   label: '1080 × 1080' },
  { id: 'story',     name: 'Story / Reel',    ratio: '9 / 16',  label: '1080 × 1920' },
  { id: 'landscape', name: 'Facebook / X',    ratio: '16 / 9',  label: '1200 × 628'  },
  { id: 'linkedin',  name: 'LinkedIn Banner', ratio: '4 / 1',   label: '1584 × 396'  },
  { id: 'rectangle', name: 'Display Ad',      ratio: '6 / 5',   label: '300 × 250'   },
];

const POSITIONS = [
  { id: 'center',        flex: 'items-center justify-center', textAlign: 'center' },
  { id: 'bottom-left',   flex: 'items-end justify-start',     textAlign: 'left'   },
  { id: 'bottom-center', flex: 'items-end justify-center',    textAlign: 'center' },
  { id: 'top-left',      flex: 'items-start justify-start',   textAlign: 'left'   },
];

const MANUAL_PRESETS = [
  { label: '🚀 Launch',  headline: 'Launch Your Vision',          sub: 'Built for the bold. Ready for growth.',       cta: 'Start Free'        },
  { label: '🛍 Sale',    headline: 'Exclusive Offer',             sub: 'Limited time — save up to 50% today',         cta: 'Shop Now'          },
  { label: '🌿 Brand',   headline: 'Crafted with Purpose',        sub: 'Sustainable. Conscious. Beautiful.',          cta: 'Discover More'     },
  { label: '📱 App',     headline: 'The App That Changes Things', sub: 'Join 100,000+ users already on board',        cta: 'Download Free'     },
  { label: '🎯 Event',   headline: "You're Invited",              sub: 'Join us for an exclusive experience',         cta: 'Reserve Your Spot' },
  { label: '💎 Premium', headline: 'Premium. Redefined.',         sub: 'Uncompromising quality for those who know.',  cta: 'Explore'           },
];

// ─── Mode ─────────────────────────────────────────────────────────────────────

const mode = ref<'manual' | 'auto'>('manual');

// ─── Manual mode state ────────────────────────────────────────────────────────

const headline      = ref('Transform Your Business');
const subheadline   = ref('Powerful solutions for modern challenges');
const ctaText       = ref('Get Started Today');
const showSub       = ref(true);
const showCta       = ref(true);
const selectedGradient  = ref('royal');
const selectedFont      = ref('modern');
const selectedSize      = ref('square');
const selectedPosition  = ref('center');
const textColorMode     = ref<'auto' | 'light' | 'dark'>('auto');
const headlineSizePx    = ref(48);
const subSizePx         = ref(20);
const isExporting       = ref(false);
const bannerRef         = ref<HTMLElement | null>(null);

// ─── Auto mode state ──────────────────────────────────────────────────────────

interface BannerVariation {
  headline: string;
  subheadline: string;
  cta: string;
  showSub: boolean;
  showCta: boolean;
  gradientId: string;
  fontId: string;
  positionId: string;
}

const brandInfo       = ref('');
const variationCount  = ref(6);
const autoSizeId      = ref('square');
const autoVariations  = ref<BannerVariation[]>([]);
const bannerRefs      = ref<Record<number, HTMLElement>>({});
const downloadingAll  = ref(false);
const downloadProgress = ref(0);

// ─── AI Ideas state ───────────────────────────────────────────────────────────

const aiPanelOpen    = ref(false);
const pinnedGradient = ref<string | null>(null);
const { isLoading: aiLoading, error: aiError, suggestions, lastCostUsd: aiCostUsd, suggest } = useBannerAI();

// ─── Expanded view state (Similar / Counter) ──────────────────────────────────

interface ExpandedView { mode: 'similar' | 'counter'; sourceIndex: number; sourceLabel: string; }
const expandedView        = ref<ExpandedView | null>(null);
const expandedVariations  = ref<BannerVariation[]>([]);
const expandedRefs        = ref<Record<number, HTMLElement>>({});
const downloadingExpanded = ref(false);
const downloadExpandedProgress = ref(0);

const VARIATION_COUNTS = [2, 4, 6, 8, 10, 12];

// ─── Manual computed ──────────────────────────────────────────────────────────

const mActiveGradient = computed(() => GRADIENTS.find(g => g.id === selectedGradient.value)!);
const mActiveFont     = computed(() => FONT_PAIRS.find(f => f.id === selectedFont.value)!);
const mActiveSize     = computed(() => SIZES.find(s => s.id === selectedSize.value)!);
const mActivePosition = computed(() => POSITIONS.find(p => p.id === selectedPosition.value)!);

const mLightText = computed(() => {
  if (textColorMode.value === 'light') return true;
  if (textColorMode.value === 'dark')  return false;
  return !mActiveGradient.value.dark;
});

const mPreviewStyle = computed(() => {
  const [w, h] = mActiveSize.value.ratio.split('/').map(s => parseFloat(s.trim()));
  const maxH = selectedSize.value === 'linkedin' ? 160 : 420;
  const byH = maxH * (w / h);
  const width = Math.min(byH, 420);
  return { width: `${width}px`, aspectRatio: mActiveSize.value.ratio };
});

function mTextColor(light: boolean)  { return light ? '#ffffff' : '#1a1a1a'; }
function mCtaBg(light: boolean)      { return light ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)'; }
function mCtaBorder(light: boolean)  { return light ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.22)'; }
function mTextShadow(light: boolean) { return light ? '0 1px 6px rgba(0,0,0,0.4)' : '0 1px 4px rgba(255,255,255,0.3)'; }

const mHeadlineStyle = computed(() => ({
  fontFamily:    `'${mActiveFont.value.heading}', sans-serif`,
  fontWeight:    mActiveFont.value.weight,
  fontSize:      `${headlineSizePx.value}px`,
  lineHeight:    '1.1',
  color:         mTextColor(mLightText.value),
  textShadow:    mTextShadow(mLightText.value),
  textAlign:     mActivePosition.value.textAlign as CanvasTextAlign,
  letterSpacing: selectedFont.value === 'impact' ? '0.02em' : '-0.01em',
  margin:        '0',
  wordBreak:     'break-word' as const,
}));

const mSubStyle = computed(() => ({
  fontFamily: `'${mActiveFont.value.body}', sans-serif`,
  fontWeight:  400,
  fontSize:   `${subSizePx.value}px`,
  lineHeight:  '1.5',
  color:       mTextColor(mLightText.value),
  textShadow:  mTextShadow(mLightText.value),
  textAlign:   mActivePosition.value.textAlign as CanvasTextAlign,
  opacity:     0.88,
  margin:      '0',
}));

const mCtaStyle = computed(() => ({
  display:       'inline-block',
  fontFamily:    `'${mActiveFont.value.body}', sans-serif`,
  fontWeight:    600,
  fontSize:      `${Math.round(subSizePx.value * 0.85)}px`,
  color:         mTextColor(mLightText.value),
  background:    mCtaBg(mLightText.value),
  border:        `1.5px solid ${mCtaBorder(mLightText.value)}`,
  borderRadius:  '9999px',
  padding:       '10px 24px',
  letterSpacing: '0.03em',
  textTransform: 'uppercase' as const,
  alignSelf:     mActivePosition.value.textAlign === 'center' ? 'center' : 'flex-start',
  marginTop:     '4px',
}));

// ─── Auto mode helpers ────────────────────────────────────────────────────────

function vGradient(v: BannerVariation) { return GRADIENTS.find(g => g.id === v.gradientId)!; }
function vFont(v: BannerVariation)     { return FONT_PAIRS.find(f => f.id === v.fontId)!; }
function vPosition(v: BannerVariation) { return POSITIONS.find(p => p.id === v.positionId)!; }
function vLight(v: BannerVariation)    { return !vGradient(v).dark; }

const autoActiveSize = computed(() => SIZES.find(s => s.id === autoSizeId.value)!);

const autoPreviewWidth = computed(() => {
  // Each card in the grid is ~220px
  return 220;
});

function varBannerStyle(v: BannerVariation) {
  return { background: vGradient(v).css };
}

function varHeadlineStyle(v: BannerVariation, small = false) {
  const light = vLight(v);
  const font  = vFont(v);
  return {
    fontFamily:    `'${font.heading}', sans-serif`,
    fontWeight:    font.weight,
    fontSize:      small ? '18px' : '42px',
    lineHeight:    '1.1',
    color:         mTextColor(light),
    textShadow:    mTextShadow(light),
    textAlign:     vPosition(v).textAlign as CanvasTextAlign,
    letterSpacing: v.fontId === 'impact' ? '0.02em' : '-0.01em',
    margin:        '0',
    wordBreak:     'break-word' as const,
  };
}

function varSubStyle(v: BannerVariation, small = false) {
  const light = vLight(v);
  const font  = vFont(v);
  return {
    fontFamily: `'${font.body}', sans-serif`,
    fontWeight:  400,
    fontSize:    small ? '10px' : '18px',
    lineHeight:  '1.4',
    color:       mTextColor(light),
    textShadow:  mTextShadow(light),
    textAlign:   vPosition(v).textAlign as CanvasTextAlign,
    opacity:     0.88,
    margin:      '0',
  };
}

function varCtaStyle(v: BannerVariation, small = false) {
  const light = vLight(v);
  const font  = vFont(v);
  return {
    display:       'inline-block',
    fontFamily:    `'${font.body}', sans-serif`,
    fontWeight:    600,
    fontSize:      small ? '8px' : '14px',
    color:         mTextColor(light),
    background:    mCtaBg(light),
    border:        `1px solid ${mCtaBorder(light)}`,
    borderRadius:  '9999px',
    padding:       small ? '4px 10px' : '8px 20px',
    letterSpacing: '0.03em',
    textTransform: 'uppercase' as const,
    alignSelf:     vPosition(v).textAlign === 'center' ? 'center' : 'flex-start',
    marginTop:     small ? '2px' : '4px',
    whiteSpace:    'nowrap' as const,
  };
}

function varPositionClasses(v: BannerVariation) {
  return `absolute inset-0 flex flex-col gap-1.5 p-4 ${vPosition(v).flex}`;
}

// ─── Auto generation ──────────────────────────────────────────────────────────

function buildTextVariants(info: string, count: number): Pick<BannerVariation, 'headline' | 'subheadline' | 'cta' | 'showSub' | 'showCta'>[] {
  const sentences = info.split(/[.\n!?]+/).map(s => s.trim()).filter(s => s.length > 2);
  const first  = sentences[0] ?? info.trim().slice(0, 60);
  const second = sentences[1] ?? '';
  const third  = sentences[2] ?? '';
  const short  = first.split(' ').slice(0, 5).join(' ');

  const lower = info.toLowerCase();
  const ctaPool = lower.includes('sale') || lower.includes('%')
    ? ['Shop Sale', 'Claim Offer', 'Save Now', 'Get the Deal', 'Buy Now', 'Limited Offer']
    : lower.includes('free')
      ? ['Try Free', 'Start Free', 'Get Free Access', 'No Credit Card', 'Sign Up Free', 'Try It Now']
      : lower.includes('app') || lower.includes('download')
        ? ['Download Now', 'Get the App', 'Install Free', 'Try It Now', 'Available Now', 'Open App']
        : ['Get Started', 'Learn More', 'Discover Now', 'Explore', 'Start Today', 'Try Now', 'See How', 'Find Out More', 'Let\'s Go', 'View More', 'Join Now', 'Book Now'];

  const templates: Pick<BannerVariation, 'headline' | 'subheadline' | 'cta' | 'showSub' | 'showCta'>[] = [
    { headline: first,          subheadline: second,       cta: ctaPool[0],  showSub: !!second, showCta: true  },
    { headline: short,          subheadline: first,        cta: ctaPool[1],  showSub: true,     showCta: true  },
    { headline: first,          subheadline: third||second,cta: ctaPool[2],  showSub: !!(third||second), showCta: true  },
    { headline: second||first,  subheadline: third,        cta: ctaPool[3],  showSub: !!third,  showCta: true  },
    { headline: first,          subheadline: '',           cta: ctaPool[4],  showSub: false,    showCta: true  },
    { headline: short,          subheadline: second,       cta: ctaPool[5],  showSub: !!second, showCta: false },
    { headline: first,          subheadline: second,       cta: ctaPool[0],  showSub: !!second, showCta: true  },
    { headline: short + '.',    subheadline: second||first,cta: ctaPool[1],  showSub: true,     showCta: true  },
    { headline: first,          subheadline: third||second,cta: ctaPool[3],  showSub: true,     showCta: true  },
    { headline: second||short,  subheadline: first,        cta: ctaPool[2],  showSub: true,     showCta: true  },
    { headline: first,          subheadline: '',           cta: ctaPool[4],  showSub: false,    showCta: false },
    { headline: short,          subheadline: third||second,cta: ctaPool[0],  showSub: true,     showCta: true  },
  ];

  return Array.from({ length: count }, (_, i) => templates[i % templates.length]);
}

function buildVisualCombos(count: number, forcedFirstId: string | null = null): Pick<BannerVariation, 'gradientId' | 'fontId' | 'positionId'>[] {
  // Spread gradients evenly across the pool for max visual variety
  const gStep = Math.ceil(GRADIENTS.length / count);
  return Array.from({ length: count }, (_, i) => ({
    gradientId: (i === 0 && forcedFirstId) ? forcedFirstId : GRADIENTS[(i * gStep) % GRADIENTS.length].id,
    fontId:     FONT_PAIRS[i % FONT_PAIRS.length].id,
    positionId: POSITIONS[i % POSITIONS.length].id,
  }));
}

function generateAuto() {
  if (!brandInfo.value.trim()) return;
  expandedView.value = null;
  expandedVariations.value = [];
  expandedRefs.value = {};
  const text   = buildTextVariants(brandInfo.value, variationCount.value);
  const visual = buildVisualCombos(variationCount.value, pinnedGradient.value);
  autoVariations.value = Array.from({ length: variationCount.value }, (_, i) => ({
    ...text[i],
    ...visual[i],
  }));
  bannerRefs.value = {};
}

async function downloadSingle(index: number) {
  const el = bannerRefs.value[index];
  if (!el) return;
  await document.fonts.ready;
  const canvas = await html2canvas(el, {
    scale:           4,
    useCORS:         true,
    allowTaint:      true,
    backgroundColor: null,
    logging:         false,
  });
  const v = autoVariations.value[index];
  const a = document.createElement('a');
  a.download = `banner-${index + 1}-${v.gradientId}-${v.fontId}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

async function downloadAll() {
  if (downloadingAll.value) return;
  downloadingAll.value = true;
  downloadProgress.value = 0;
  for (let i = 0; i < autoVariations.value.length; i++) {
    await downloadSingle(i);
    downloadProgress.value = i + 1;
    await new Promise(r => setTimeout(r, 450));
  }
  downloadingAll.value = false;
  downloadProgress.value = 0;
}

// ─── AI ideas ─────────────────────────────────────────────────────────────────

function applyAngle(ma: NonNullable<BannerSuggestions>['marketingAngles'][number]) {
  brandInfo.value = `${ma.headline}. ${ma.sub}. ${ma.cta}`;
  generateAuto();
}

// ─── Similar / Counter generation ────────────────────────────────────────────

const DARK_BG_IDS  = ['royal', 'sunset', 'ocean', 'fire', 'midnight', 'rose', 'sage', 'carbon', 'deep', 'wine'];
const LIGHT_BG_IDS = ['forest', 'gold', 'aurora', 'peach', 'spring', 'ice'];

function generateSimilarTo(i: number) {
  const source  = autoVariations.value[i];
  const srcGIdx = GRADIENTS.findIndex(g => g.id === source.gradientId);
  const srcFIdx = FONT_PAIRS.findIndex(f => f.id === source.fontId);
  const srcPIdx = POSITIONS.findIndex(p => p.id === source.positionId);
  const adjGrads = [0, 1, 2, -1, -2, 3].map(o => GRADIENTS[(srcGIdx + o + 16) % 16]);
  const altFont  = FONT_PAIRS[(srcFIdx + 1) % 6];
  const adjPos   = [0, 1, -1].map(o => POSITIONS[(srcPIdx + o + 4) % 4]);
  const text     = buildTextVariants(brandInfo.value, 20);
  expandedVariations.value = Array.from({ length: 20 }, (_, idx) => ({
    ...text[idx],
    gradientId: adjGrads[idx % 6].id,
    fontId:     idx % 4 === 3 ? altFont.id : source.fontId,
    positionId: adjPos[idx % 3].id,
  }));
  expandedView.value = { mode: 'similar', sourceIndex: i, sourceLabel: `#${i + 1}` };
  expandedRefs.value = {};
}

function generateCounterTo(i: number) {
  const source   = autoVariations.value[i];
  const srcGrad  = GRADIENTS.find(g => g.id === source.gradientId)!;
  const srcFIdx  = FONT_PAIRS.findIndex(f => f.id === source.fontId);
  const srcPIdx  = POSITIONS.findIndex(p => p.id === source.positionId);
  const pool       = srcGrad.dark ? DARK_BG_IDS : LIGHT_BG_IDS;
  const cFontIdx   = (srcFIdx + 3) % 6;
  const mixFontIdx = (srcFIdx + 2) % 6;
  const cPosIdx    = (srcPIdx + 2) % 4;
  const aPosIdx    = (srcPIdx + 3) % 4;
  const srcCta = source.cta.toLowerCase();
  const counterCtas = srcCta.includes('start') || srcCta.includes('try')
    ? ['Go Pro', 'VIP Access', 'Unlock Everything', 'Power User Plan', 'Enterprise Access', 'All-in Plan', 'Upgrade Now', 'Full Suite', 'Advanced Features', 'Skip the Trial']
    : srcCta.includes('shop') || srcCta.includes('buy') || srcCta.includes('sale')
    ? ['Exclusive Members Only', 'No Sales. Just Value.', 'Subscribe & Save', 'Loyalty Rewards', 'Annual Plan', 'Insider Deal', 'Premium Access', 'VIP Pricing', 'Members Only', 'Best Price Guarantee']
    : srcCta.includes('download') || srcCta.includes('app')
    ? ['Web Version', 'No Install Needed', 'Cloud Access', 'Browser-Based', 'Desktop App', 'API Access', 'White-Label', 'Team Edition', 'Offline Mode', 'Enterprise Deploy']
    : ['See It in Action', 'Watch the Demo', 'Compare Plans', 'Read Case Studies', 'Talk to Sales', 'Request a Quote', 'Schedule a Call', 'View Pricing', 'Meet the Team', 'Our Story'];
  const text = buildTextVariants(brandInfo.value, 20);
  expandedVariations.value = Array.from({ length: 20 }, (_, idx) => ({
    ...text[idx],
    cta:        counterCtas[idx % counterCtas.length],
    gradientId: pool[idx % pool.length],
    fontId:     idx % 5 === 4 ? FONT_PAIRS[mixFontIdx].id : FONT_PAIRS[cFontIdx].id,
    positionId: idx % 3 === 0 ? POSITIONS[aPosIdx].id : POSITIONS[cPosIdx].id,
  }));
  expandedView.value = { mode: 'counter', sourceIndex: i, sourceLabel: `#${i + 1}` };
  expandedRefs.value = {};
}

function backToAll() {
  expandedView.value = null;
  expandedVariations.value = [];
  expandedRefs.value = {};
}

async function downloadExpanded(index: number) {
  const el = expandedRefs.value[index];
  if (!el) return;
  await document.fonts.ready;
  const canvas = await html2canvas(el, {
    scale: 4, useCORS: true, allowTaint: true, backgroundColor: null, logging: false,
  });
  const v = expandedVariations.value[index];
  const a = document.createElement('a');
  a.download = `banner-${expandedView.value?.mode}-${index + 1}-${v.gradientId}-${v.fontId}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

async function downloadAllExpanded() {
  if (downloadingExpanded.value) return;
  downloadingExpanded.value = true;
  downloadExpandedProgress.value = 0;
  for (let i = 0; i < expandedVariations.value.length; i++) {
    await downloadExpanded(i);
    downloadExpandedProgress.value = i + 1;
    await new Promise(r => setTimeout(r, 450));
  }
  downloadingExpanded.value = false;
  downloadExpandedProgress.value = 0;
}

// ─── Manual export ────────────────────────────────────────────────────────────

async function exportManual() {
  if (!bannerRef.value || isExporting.value) return;
  isExporting.value = true;
  try {
    await document.fonts.ready;
    const canvas = await html2canvas(bannerRef.value, {
      scale: 3, useCORS: true, allowTaint: true, backgroundColor: null, logging: false,
    });
    const a = document.createElement('a');
    a.download = `banner-${selectedSize.value}-${selectedGradient.value}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  } finally {
    isExporting.value = false;
  }
}

// ─── Fonts ────────────────────────────────────────────────────────────────────

onMounted(() => {
  if (document.querySelector('link[data-banner-fonts]')) return;
  const families = [
    'Montserrat:wght@600;700;800', 'Open+Sans:wght@400;600',
    'Playfair+Display:ital,wght@0,400;0,700;1,400', 'Lato:wght@400;700',
    'Oswald:wght@400;600', 'Source+Sans+3:wght@400;600',
    'Poppins:wght@400;500;600;700', 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400',
    'Raleway:wght@400;700;800', 'Roboto:wght@400;700',
  ];
  const link = Object.assign(document.createElement('link'), {
    rel: 'stylesheet',
    href: `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`,
  });
  link.dataset.bannerFonts = '1';
  document.head.appendChild(link);
});
</script>

<template>
  <div class="flex h-full min-h-screen flex-col">

    <!-- ── Mode tabs ─────────────────────────────────────────────────────────── -->
    <div class="border-b border-gray-200 bg-white px-6 flex items-center gap-1 shrink-0 h-12">
      <button
        v-for="m in (['manual', 'auto'] as const)"
        :key="m"
        :class="[
          'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
          mode === m
            ? 'bg-brand-600 text-white'
            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
        ]"
        @click="mode = m"
      >
        {{ m === 'manual' ? 'Manual editor' : '✦ Auto generate' }}
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- MANUAL MODE                                                           -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <div v-if="mode === 'manual'" class="flex flex-1 min-h-0">

      <!-- Left panel -->
      <aside class="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
        <div class="flex-1 px-5 py-5 space-y-6">

          <!-- Quick presets -->
          <section>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Quick fill</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="p in MANUAL_PRESETS" :key="p.label"
                class="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                @click="headline = p.headline; subheadline = p.sub; ctaText = p.cta; showSub = true; showCta = true"
              >{{ p.label }}</button>
            </div>
          </section>

          <!-- Text content -->
          <section class="space-y-3">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Text</p>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Headline</label>
              <textarea v-model="headline" rows="2" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs text-gray-500">Subheadline</label>
                <button class="text-xs" :class="showSub ? 'text-brand-600' : 'text-gray-300'" @click="showSub = !showSub">{{ showSub ? 'visible' : 'hidden' }}</button>
              </div>
              <textarea v-model="subheadline" rows="2" :disabled="!showSub" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none disabled:opacity-40" />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs text-gray-500">CTA button</label>
                <button class="text-xs" :class="showCta ? 'text-brand-600' : 'text-gray-300'" @click="showCta = !showCta">{{ showCta ? 'visible' : 'hidden' }}</button>
              </div>
              <input v-model="ctaText" type="text" :disabled="!showCta" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-40" />
            </div>
          </section>

          <!-- Font size sliders -->
          <section class="space-y-2">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Size</p>
            <div class="flex items-center gap-3">
              <label class="text-xs text-gray-500 w-20 shrink-0">Headline</label>
              <input v-model.number="headlineSizePx" type="range" min="24" max="96" step="2" class="flex-1 accent-brand-600" />
              <span class="text-xs text-gray-400 w-8 text-right">{{ headlineSizePx }}</span>
            </div>
            <div class="flex items-center gap-3">
              <label class="text-xs text-gray-500 w-20 shrink-0">Body</label>
              <input v-model.number="subSizePx" type="range" min="12" max="40" step="1" class="flex-1 accent-brand-600" />
              <span class="text-xs text-gray-400 w-8 text-right">{{ subSizePx }}</span>
            </div>
          </section>

          <!-- Gradient swatches -->
          <section>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Background</p>
            <div class="grid grid-cols-8 gap-1.5">
              <button
                v-for="g in GRADIENTS" :key="g.id" :title="g.name"
                :style="{ background: g.css }"
                :class="['w-7 h-7 rounded-lg transition-all', selectedGradient === g.id ? 'ring-2 ring-brand-600 ring-offset-1 scale-110' : 'hover:scale-110']"
                @click="selectedGradient = g.id"
              />
            </div>
          </section>

          <!-- Font pair -->
          <section>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Font</p>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="fp in FONT_PAIRS" :key="fp.id"
                :class="['px-3 py-2 rounded-lg text-left transition-colors border text-xs', selectedFont === fp.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300']"
                @click="selectedFont = fp.id"
              >
                <span :style="{ fontFamily: `'${fp.heading}', sans-serif`, fontWeight: fp.weight }" class="block text-sm leading-tight">{{ fp.name }}</span>
                <span class="text-xs opacity-60 mt-0.5 block">{{ fp.heading }}</span>
              </button>
            </div>
          </section>

          <!-- Format -->
          <section>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Format</p>
            <div class="space-y-1">
              <button
                v-for="s in SIZES" :key="s.id"
                :class="['w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors border', selectedSize === s.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300']"
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
                v-for="p in POSITIONS" :key="p.id"
                :class="['px-3 py-2 rounded-lg text-xs font-medium border transition-colors capitalize', selectedPosition === p.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300']"
                @click="selectedPosition = p.id"
              >{{ p.id.replace('-', ' ') }}</button>
            </div>
          </section>

          <!-- Text color -->
          <section>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Text color</p>
            <div class="flex gap-1.5">
              <button
                v-for="opt in (['auto', 'light', 'dark'] as const)" :key="opt"
                :class="['flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors', textColorMode === opt ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300']"
                @click="textColorMode = opt"
              >{{ opt }}</button>
            </div>
          </section>

        </div>
      </aside>

      <!-- Preview panel -->
      <main class="flex-1 flex flex-col items-center justify-start pt-10 pb-16 px-8 bg-gray-50 overflow-auto">
        <div class="w-full max-w-2xl flex items-center justify-between mb-6">
          <div>
            <p class="text-sm font-semibold text-gray-900">Preview</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ mActiveSize.name }} · {{ mActiveSize.label }}px</p>
          </div>
          <Button :loading="isExporting" @click="exportManual">Download PNG</Button>
        </div>

        <div class="shadow-2xl rounded-xl overflow-hidden" :style="mPreviewStyle">
          <div ref="bannerRef" class="relative w-full h-full" :style="{ background: mActiveGradient.css }">
            <div class="absolute inset-0 flex flex-col gap-3 p-8" :class="mActivePosition.flex">
              <h1 :style="mHeadlineStyle">{{ headline }}</h1>
              <p v-if="showSub && subheadline" :style="mSubStyle">{{ subheadline }}</p>
              <span v-if="showCta && ctaText" :style="mCtaStyle">{{ ctaText }}</span>
            </div>
          </div>
        </div>

        <p class="mt-5 text-xs text-gray-400 text-center max-w-sm">Exported at 3× preview resolution. Requires internet for Google Fonts.</p>
      </main>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- AUTO MODE                                                             -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <div v-else class="flex flex-1 min-h-0">

      <!-- Left panel: inputs -->
      <aside class="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
        <div class="flex-1 px-5 py-5 space-y-6">

          <section>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Brand info</p>
            <p class="text-xs text-gray-400 mb-2">Paste a few lines about your brand, product, or offer. The generator will create varied banners from your content.</p>
            <textarea
              v-model="brandInfo"
              rows="8"
              placeholder="MBGen – AI marketing studio&#10;Generate campaigns in minutes&#10;Start your free trial today&#10;&#10;Add more lines for more text variety..."
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </section>

          <!-- Variation count -->
          <section>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">How many banners</p>
            <div class="flex gap-1.5 flex-wrap">
              <button
                v-for="n in VARIATION_COUNTS" :key="n"
                :class="['w-10 h-9 rounded-lg text-sm font-semibold border transition-colors', variationCount === n ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300']"
                @click="variationCount = n"
              >{{ n }}</button>
            </div>
          </section>

          <!-- Format -->
          <section>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Format</p>
            <div class="space-y-1">
              <button
                v-for="s in SIZES" :key="s.id"
                :class="['w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors border', autoSizeId === s.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300']"
                @click="autoSizeId = s.id"
              >
                <span class="font-medium">{{ s.name }}</span>
                <span class="opacity-60 font-mono">{{ s.label }}</span>
              </button>
            </div>
          </section>

          <!-- AI Ideas -->
          <section>
            <button
              class="w-full flex items-center justify-between text-xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-800 transition-colors"
              @click="aiPanelOpen = !aiPanelOpen"
            >
              <span>✦ AI Ideas</span>
              <span class="text-base leading-none">{{ aiPanelOpen ? '−' : '+' }}</span>
            </button>

            <div v-if="aiPanelOpen" class="mt-3 space-y-3">
              <Button
                size="sm"
                class="w-full"
                :loading="aiLoading"
                :disabled="!brandInfo.trim() || aiLoading"
                @click="suggest(brandInfo)"
              >
                {{ aiLoading ? 'Generating ideas…' : 'Generate AI ideas' }}
              </Button>

              <p v-if="aiError" class="text-xs text-red-500">{{ aiError }}</p>
              <p v-if="aiCostUsd !== null && !aiError" class="text-xs text-gray-400 text-right font-mono">cost: ${{ aiCostUsd.toFixed(4) }}</p>

              <template v-if="suggestions">
                <!-- Headlines -->
                <div>
                  <p class="text-xs text-gray-400 mb-1 font-medium">Headlines</p>
                  <button
                    v-for="h in suggestions.headlines" :key="h"
                    class="block w-full text-left text-xs text-gray-700 hover:text-brand-600 py-1 border-b border-gray-100 last:border-0 truncate transition-colors"
                    :title="h"
                    @click="brandInfo = h"
                  >{{ h }}</button>
                </div>

                <!-- Subheadlines -->
                <div>
                  <p class="text-xs text-gray-400 mb-1 font-medium">Subheadlines</p>
                  <button
                    v-for="s in suggestions.subheadlines" :key="s"
                    class="block w-full text-left text-xs text-gray-700 hover:text-brand-600 py-1 border-b border-gray-100 last:border-0 truncate transition-colors"
                    :title="s"
                    @click="brandInfo += '\n' + s"
                  >{{ s }}</button>
                </div>

                <!-- CTAs -->
                <div>
                  <p class="text-xs text-gray-400 mb-1 font-medium">CTA ideas</p>
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      v-for="c in suggestions.ctas" :key="c"
                      class="px-2.5 py-1 text-xs bg-gray-100 hover:bg-brand-50 hover:text-brand-700 text-gray-700 rounded-lg transition-colors"
                      @click="brandInfo += '\n' + c"
                    >{{ c }}</button>
                  </div>
                </div>

                <!-- Color recommendations -->
                <div>
                  <p class="text-xs text-gray-400 mb-1 font-medium">Suggested colors</p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="cr in suggestions.colorRecommendations" :key="cr.gradientId"
                      :title="cr.reason"
                      :style="{ background: GRADIENTS.find(g => g.id === cr.gradientId)?.css ?? '#ccc' }"
                      :class="[
                        'w-8 h-8 rounded-lg transition-all',
                        pinnedGradient === cr.gradientId
                          ? 'ring-2 ring-brand-600 ring-offset-1 scale-110'
                          : 'hover:scale-110',
                      ]"
                      @click="pinnedGradient = pinnedGradient === cr.gradientId ? null : cr.gradientId"
                    />
                  </div>
                  <p v-if="pinnedGradient" class="text-xs text-brand-600 mt-1">Pinned as first variation</p>
                </div>

                <!-- Marketing angles -->
                <div>
                  <p class="text-xs text-gray-400 mb-1 font-medium">Marketing angles</p>
                  <button
                    v-for="ma in suggestions.marketingAngles" :key="ma.angle"
                    class="w-full text-left px-2.5 py-2 rounded-lg border border-gray-200 hover:border-brand-400 hover:bg-brand-50 text-xs mb-1.5 transition-colors"
                    @click="applyAngle(ma)"
                  >
                    <span class="font-semibold text-gray-700 block">{{ ma.angle }}</span>
                    <span class="text-gray-400 truncate block mt-0.5">{{ ma.headline }}</span>
                  </button>
                </div>
              </template>
            </div>
          </section>

          <Button
            class="w-full"
            :disabled="!brandInfo.trim()"
            @click="generateAuto"
          >
            ✦ Generate {{ variationCount }} banners
          </Button>

        </div>
      </aside>

      <!-- Right panel: grid -->
      <main class="flex-1 overflow-auto bg-gray-50 p-8">

        <!-- ── Expanded view (Similar / Counter) ──────────────────────────────── -->
        <template v-if="expandedView">
          <!-- Header -->
          <div class="flex items-center gap-3 mb-5">
            <button
              class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors shrink-0"
              @click="backToAll"
            >
              ← Back
            </button>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 capitalize">
                20 {{ expandedView.mode }} variations of {{ expandedView.sourceLabel }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">{{ autoActiveSize.label }}px · exported at 4× resolution</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span v-if="downloadingExpanded" class="text-xs text-gray-400">
                Downloading {{ downloadExpandedProgress }}/20...
              </span>
              <Button variant="secondary" size="sm" :loading="downloadingExpanded" @click="downloadAllExpanded">
                Download all 20
              </Button>
            </div>
          </div>

          <!-- Expanded grid -->
          <div class="grid gap-4" style="grid-template-columns: repeat(4, minmax(0, 1fr))">
            <div v-for="(v, i) in expandedVariations" :key="i" class="group relative">
              <div class="rounded-xl overflow-hidden shadow-md" :style="{ aspectRatio: autoActiveSize.ratio }">
                <div
                  :ref="(el) => { if (el) expandedRefs[i] = el as HTMLElement }"
                  class="relative w-full h-full"
                  :style="varBannerStyle(v)"
                >
                  <div :class="varPositionClasses(v)">
                    <h1 :style="varHeadlineStyle(v, true)">{{ v.headline }}</h1>
                    <p v-if="v.showSub && v.subheadline" :style="varSubStyle(v, true)">{{ v.subheadline }}</p>
                    <span v-if="v.showCta && v.cta" :style="varCtaStyle(v, true)">{{ v.cta }}</span>
                  </div>
                </div>
              </div>
              <div class="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  class="bg-white text-gray-900 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors shadow"
                  @click="downloadExpanded(i)"
                >
                  Download PNG
                </button>
              </div>
              <div class="mt-1.5 flex items-center gap-1.5 px-0.5">
                <div class="w-3 h-3 rounded-full shrink-0" :style="{ background: vGradient(v).css }" />
                <p class="text-xs text-gray-400 truncate">{{ vGradient(v).name }} · {{ vFont(v).name }}</p>
              </div>
            </div>
          </div>
        </template>

        <!-- ── Normal view ─────────────────────────────────────────────────────── -->
        <template v-else>

          <!-- Empty state -->
          <div v-if="autoVariations.length === 0" class="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div class="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-2xl">✦</div>
            <p class="text-sm font-medium text-gray-700">Paste your brand info and click Generate</p>
            <p class="text-xs text-gray-400 max-w-xs">The generator will create {{ variationCount }} unique banner variations using different gradients, fonts, and layouts.</p>
          </div>

          <!-- Results header -->
          <div v-else class="flex items-center justify-between mb-5">
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ autoVariations.length }} variations · {{ autoActiveSize.name }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ autoActiveSize.label }}px · exported at 4× resolution</p>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="downloadingAll" class="text-xs text-gray-400">
                Downloading {{ downloadProgress }}/{{ autoVariations.length }}...
              </span>
              <Button
                variant="secondary"
                size="sm"
                :loading="downloadingAll"
                @click="downloadAll"
              >
                Download all
              </Button>
            </div>
          </div>

          <!-- Banner grid -->
          <div
            v-if="autoVariations.length > 0"
            class="grid gap-4"
            :style="{ gridTemplateColumns: `repeat(${Math.min(autoVariations.length, variationCount <= 4 ? 2 : variationCount <= 8 ? 3 : 4)}, minmax(0, 1fr))` }"
          >
            <div
              v-for="(v, i) in autoVariations"
              :key="i"
              class="group relative"
            >
              <!-- Banner preview -->
              <div
                class="rounded-xl overflow-hidden shadow-md"
                :style="{ aspectRatio: autoActiveSize.ratio }"
              >
                <div
                  :ref="(el) => { if (el) bannerRefs[i] = el as HTMLElement }"
                  class="relative w-full h-full"
                  :style="varBannerStyle(v)"
                >
                  <div :class="varPositionClasses(v)">
                    <h1 :style="varHeadlineStyle(v, true)">{{ v.headline }}</h1>
                    <p v-if="v.showSub && v.subheadline" :style="varSubStyle(v, true)">{{ v.subheadline }}</p>
                    <span v-if="v.showCta && v.cta" :style="varCtaStyle(v, true)">{{ v.cta }}</span>
                  </div>
                </div>
              </div>

              <!-- Hover overlay: download + similar + counter -->
              <div class="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                <button
                  class="w-full bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors shadow"
                  @click="downloadSingle(i)"
                >
                  Download PNG
                </button>
                <button
                  class="w-full bg-white/20 border border-white/40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors"
                  @click="generateSimilarTo(i)"
                >
                  Similar ×20
                </button>
                <button
                  class="w-full bg-white/20 border border-white/40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors"
                  @click="generateCounterTo(i)"
                >
                  Counter ×20
                </button>
              </div>

              <!-- Badge: gradient + font -->
              <div class="mt-1.5 flex items-center gap-1.5 px-0.5">
                <div class="w-3 h-3 rounded-full shrink-0" :style="{ background: vGradient(v).css }" />
                <p class="text-xs text-gray-400 truncate">{{ vGradient(v).name }} · {{ vFont(v).name }}</p>
              </div>
            </div>
          </div>

        </template>

      </main>
    </div>

  </div>
</template>
