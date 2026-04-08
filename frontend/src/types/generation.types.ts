export type GenerationType = 'copy' | 'image' | 'animation' | 'video';
export type GenerationStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

export type Platform =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'twitter'
  | 'linkedin';

export interface PlatformSpec {
  displayName: string;
  color: string;
  aspectRatios: string[];
  maxCopyLength: number;
  videoMaxDuration: number;
}

export interface AnimationElement {
  id: string;
  type: 'text' | 'shape' | 'image';
  content?: string;
  style: Record<string, string | number>;
  animation: {
    from: Record<string, string | number>;
    to: Record<string, string | number>;
    delay?: number;
    duration?: number;
    ease?: string;
  };
}

export interface GsapAnimationConfig {
  elements: AnimationElement[];
  duration: number;
  background: string;
}

export interface GenerationContent {
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  animationConfig?: GsapAnimationConfig;
}

export interface Generation {
  id: string;
  campaignId: string;
  type: GenerationType;
  platform: string;
  content: GenerationContent;
  promptUsed: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  externalJobId?: string;
  model?: string | null;
  estimatedCostUsd?: string | null;
  actualCostUsd?: string | null;
  costUsd?: number;
  createdAt: string;
}
