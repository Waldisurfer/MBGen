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

export interface Campaign {
  id: string;
  name: string;
  strategy: string;
  audience: AudienceData;
  brand: BrandData;
  brief: StructuredBrief | null;
  createdAt: string;
}
