export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

// --- Image Models ---

export interface ImageModelConfig {
  id: string;
  replicateModel: string;
  displayName: string;
  badge?: string;
  badgeVariant?: 'success' | 'info' | 'warning' | 'default';
  estimatedSeconds: number;
  estimatedCostUsd: number;
  buildInput: (prompt: string, aspectRatio: AspectRatio) => Record<string, unknown>;
}

// Recraft V3 uses pixel size strings instead of aspect_ratio
const RECRAFT_SIZES: Record<AspectRatio, string> = {
  '1:1':  '1024x1024',
  '16:9': '1820x1024',
  '9:16': '1024x1820',
  '4:3':  '1365x1024',
  '3:4':  '1024x1365',
};

// Ideogram V2 uses ASPECT_W_H enum strings
const IDEOGRAM_RATIOS: Record<AspectRatio, string> = {
  '1:1':  'ASPECT_1_1',
  '16:9': 'ASPECT_16_9',
  '9:16': 'ASPECT_9_16',
  '4:3':  'ASPECT_4_3',
  '3:4':  'ASPECT_3_4',
};

export const IMAGE_MODELS: ImageModelConfig[] = [
  {
    id: 'flux-1.1-pro',
    replicateModel: 'black-forest-labs/flux-1.1-pro',
    displayName: 'FLUX 1.1 Pro',
    badge: 'Best',
    badgeVariant: 'success',
    estimatedSeconds: 20,
    estimatedCostUsd: 0.04,
    buildInput: (prompt, aspectRatio) => ({
      prompt,
      aspect_ratio: aspectRatio,
      output_format: 'webp',
      output_quality: 90,
    }),
  },
  {
    id: 'flux-pro',
    replicateModel: 'black-forest-labs/flux-pro',
    displayName: 'FLUX Pro',
    estimatedSeconds: 15,
    estimatedCostUsd: 0.055,
    buildInput: (prompt, aspectRatio) => ({
      prompt,
      aspect_ratio: aspectRatio,
      output_format: 'webp',
      output_quality: 90,
    }),
  },
  {
    id: 'flux-schnell',
    replicateModel: 'black-forest-labs/flux-schnell',
    displayName: 'FLUX Schnell',
    badge: 'Fast',
    badgeVariant: 'info',
    estimatedSeconds: 5,
    estimatedCostUsd: 0.003,
    buildInput: (prompt, aspectRatio) => ({
      prompt,
      aspect_ratio: aspectRatio,
      output_format: 'webp',
      output_quality: 90,
    }),
  },
  {
    id: 'recraft-v3',
    replicateModel: 'recraft-ai/recraft-v3',
    displayName: 'Recraft V3',
    badge: 'Marketing',
    badgeVariant: 'warning',
    estimatedSeconds: 25,
    estimatedCostUsd: 0.022,
    buildInput: (prompt, aspectRatio) => ({
      prompt,
      size: RECRAFT_SIZES[aspectRatio] ?? '1024x1024',
      style: 'realistic_image',
    }),
  },
  {
    id: 'ideogram-v2',
    replicateModel: 'ideogram-ai/ideogram-v2',
    displayName: 'Ideogram V2',
    badge: 'Text',
    badgeVariant: 'default',
    estimatedSeconds: 30,
    estimatedCostUsd: 0.08,
    buildInput: (prompt, aspectRatio) => ({
      prompt,
      aspect_ratio: IDEOGRAM_RATIOS[aspectRatio] ?? 'ASPECT_1_1',
      style_type: 'REALISTIC',
      magic_prompt_option: 'AUTO',
    }),
  },
  {
    id: 'sd-3.5-large',
    replicateModel: 'stability-ai/stable-diffusion-3.5-large',
    displayName: 'SD 3.5 Large',
    estimatedSeconds: 25,
    estimatedCostUsd: 0.035,
    buildInput: (prompt, aspectRatio) => ({
      prompt,
      aspect_ratio: aspectRatio,
      cfg: 4.5,
      steps: 28,
    }),
  },
];

export const DEFAULT_IMAGE_MODEL_ID = 'flux-1.1-pro';

export function getImageModel(id: string): ImageModelConfig {
  const model = IMAGE_MODELS.find((m) => m.id === id);
  if (!model) throw new Error(`Unknown image model: ${id}`);
  return model;
}

// --- Video Models ---

export type VideoModelProvider = 'google' | 'replicate';

export interface VideoModelConfig {
  id: string;
  provider: VideoModelProvider;
  replicateModel?: string;
  displayName: string;
  badge?: string;
  badgeVariant?: 'success' | 'info' | 'warning' | 'default';
  estimatedSeconds: number;
  estimatedCostUsd: number;
}

export const VIDEO_MODELS: VideoModelConfig[] = [
  {
    id: 'veo-2',
    provider: 'google',
    displayName: 'Veo 2',
    badge: 'Premium',
    badgeVariant: 'success',
    estimatedSeconds: 180,
    estimatedCostUsd: 1.75,
  },
  {
    id: 'wan-2.1-480p',
    provider: 'replicate',
    replicateModel: 'wan-ai/wan2.1-t2v-480p',
    displayName: 'Wan 2.1',
    badge: 'Fast',
    badgeVariant: 'info',
    estimatedSeconds: 60,
    estimatedCostUsd: 0.05,
  },
  {
    id: 'minimax-video-01',
    provider: 'replicate',
    replicateModel: 'minimax/video-01',
    displayName: 'MiniMax Video',
    estimatedSeconds: 90,
    estimatedCostUsd: 0.10,
  },
  {
    id: 'luma-dream-machine',
    provider: 'replicate',
    replicateModel: 'luma/dream-machine',
    displayName: 'Luma Dream Machine',
    badge: 'Creative',
    badgeVariant: 'warning',
    estimatedSeconds: 90,
    estimatedCostUsd: 0.14,
  },
];

export const DEFAULT_VIDEO_MODEL_ID = 'veo-2';

export function getVideoModel(id: string): VideoModelConfig {
  const model = VIDEO_MODELS.find((m) => m.id === id);
  if (!model) throw new Error(`Unknown video model: ${id}`);
  return model;
}

// --- Claude API costs per call ---

export const CLAUDE_COSTS = {
  bannerSuggest:     0.003,
  copyGenerate:      0.002,
  campaignParse:     0.015,
  animationGenerate: 0.003,
  rewritePrompt:     0.001,
  strategyParse:     0.015,
} as const;
