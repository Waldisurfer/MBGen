export interface AudienceData {
  demographics: string;
  psychographics: string;
  painPoints: string;
  channels: string[];
}

export interface BrandData {
  name: string;
  tone: string;
  colors: string[];
  fonts: string[];
  logoKey?: string;
}

export interface CampaignFormData {
  name: string;
  strategy: string;
  audience: AudienceData;
  brand: BrandData;
  inspirationKeys: string[];
}

export interface StructuredBrief {
  coreConcept: string;
  keyMessages: string[];
  targetEmotion: string;
  visualDirection: string;
  tonalGuidelines: string;
  platformAdaptations: Record<string, string>;
}

export interface GenerationContent {
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  animationConfig?: GsapAnimationConfig;
}

export interface GsapAnimationConfig {
  elements: AnimationElement[];
  duration: number;
  background: string;
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

export interface ParsedCampaignSuggestion {
  suggestedName: string;
  campaignGoal: string;
  strategyNarrative: string;
  audience: AudienceData;
  brand: BrandData;
  dailyBudget?: string;
  adFormats: string[];
  copyExamples: Array<{ language: string; text: string }>;
  sourceSegmentLabel: string;
  documentTitle?: string;
}

export type GenerationType = 'copy' | 'image' | 'animation' | 'video';
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImageStatusResult {
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  outputUrl?: string;
  error?: string;
}

export interface VideoStatusResult {
  status: 'processing' | 'completed' | 'failed';
  gcsUri?: string;
  error?: string;
}
