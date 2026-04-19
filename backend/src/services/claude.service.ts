import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type {
  CampaignFormData,
  StructuredBrief,
  GsapAnimationConfig,
  ParsedCampaignSuggestion,
} from '../types/api.types';

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

function getText(response: Anthropic.Message): string {
  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}

export async function parseCampaignBrief(formData: CampaignFormData): Promise<StructuredBrief> {
  console.log(`[claude] parseCampaignBrief name="${formData.name}"`);
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are a senior creative strategist. Parse this marketing campaign brief and return a structured JSON object.

Campaign data:
${JSON.stringify(formData, null, 2)}

Return ONLY valid JSON with this exact shape:
{
  "coreConcept": "one sentence core idea",
  "keyMessages": ["message 1", "message 2", "message 3"],
  "targetEmotion": "primary emotion to evoke",
  "visualDirection": "detailed visual style description",
  "tonalGuidelines": "how copy should sound",
  "platformAdaptations": {
    "instagram": "platform-specific guidance",
    "tiktok": "platform-specific guidance",
    "facebook": "platform-specific guidance",
    "linkedin": "platform-specific guidance",
    "youtube": "platform-specific guidance"
  }
}`,
      },
    ],
  });

  const text = getText(response);
  console.log(`[claude] parseCampaignBrief raw response length=${text.length}`);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Claude response');
  return JSON.parse(jsonMatch[0]) as StructuredBrief;
}

export async function generateCopy(
  brief: StructuredBrief,
  platform: string,
  instruction?: string,
  styleContext?: string
): Promise<string> {
  console.log(`[claude] generateCopy platform=${platform} hasInstruction=${!!instruction} hasStyle=${!!styleContext}`);
  const instructionClause = instruction
    ? `\n\nUser refinement instruction: "${instruction}". Apply this to the output.`
    : '';
  const styleClause = styleContext
    ? `\n\nBrand style guidelines (follow these):\n${styleContext}`
    : '';

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Write compelling marketing copy for ${platform} based on this campaign brief:${styleClause}

Core concept: ${brief.coreConcept}
Key messages: ${brief.keyMessages.join(', ')}
Target emotion: ${brief.targetEmotion}
Tone: ${brief.tonalGuidelines}
Platform guidance: ${brief.platformAdaptations[platform] ?? 'Keep it engaging and on-brand'}
${instructionClause}

Write the ${platform} copy now. Include hooks, body copy, and a call to action. Be creative and platform-native.`,
      },
    ],
  });

  return getText(response);
}

export async function generateAnimationConfig(
  brief: StructuredBrief,
  platform: string,
  instruction?: string,
  styleContext?: string
): Promise<GsapAnimationConfig> {
  console.log(`[claude] generateAnimationConfig platform=${platform} hasInstruction=${!!instruction} hasStyle=${!!styleContext}`);
  const instructionClause = instruction
    ? `\n\nUser refinement: "${instruction}". Apply this to the animation.`
    : '';
  const styleClause = styleContext
    ? `\n\nBrand style guidelines (use these colors/fonts in the animation):\n${styleContext}`
    : '';

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Create a GSAP animation configuration for a ${platform} ad.${styleClause}

Campaign brief:
- Core concept: ${brief.coreConcept}
- Key messages: ${brief.keyMessages.slice(0, 2).join(', ')}
- Visual direction: ${brief.visualDirection}
- Target emotion: ${brief.targetEmotion}
${instructionClause}

Return ONLY valid JSON with this exact shape:
{
  "duration": 5,
  "background": "#hex-color",
  "elements": [
    {
      "id": "el1",
      "type": "text",
      "content": "Your headline here",
      "style": { "fontSize": 48, "color": "#ffffff", "fontWeight": "bold", "top": "40%", "left": "10%" },
      "animation": { "from": { "opacity": 0, "y": 40 }, "to": { "opacity": 1, "y": 0 }, "delay": 0.2, "duration": 0.8, "ease": "power2.out" }
    },
    {
      "id": "el2",
      "type": "text",
      "content": "Subheadline or CTA",
      "style": { "fontSize": 24, "color": "#eeeeee", "top": "55%", "left": "10%" },
      "animation": { "from": { "opacity": 0, "y": 20 }, "to": { "opacity": 1, "y": 0 }, "delay": 0.6, "duration": 0.6, "ease": "power2.out" }
    }
  ]
}`,
      },
    ],
  });

  const text = getText(response);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Claude animation response');
  return JSON.parse(jsonMatch[0]) as GsapAnimationConfig;
}

export async function rewritePrompt(
  originalPrompt: string,
  currentOutput: string,
  instruction: string
): Promise<string> {
  console.log(`[claude] rewritePrompt instruction="${instruction}"`);
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `You are a creative director. Rewrite the original prompt to incorporate user feedback.

Original prompt:
${originalPrompt}

Current output:
${currentOutput}

User feedback:
${instruction}

Return ONLY the rewritten prompt text. No explanation, no preamble.`,
      },
    ],
  });

  return getText(response);
}

export async function parseStrategyDocument(
  rawDocument: string
): Promise<ParsedCampaignSuggestion[]> {
  console.log(`[claude] parseStrategyDocument length=${rawDocument.length}`);
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a senior media planner and creative strategist. Parse this raw marketing strategy document and extract every distinct campaign segment or audience profile as a structured object.

RULES:
1. One document may contain multiple campaigns or ad sets. Extract EACH ONE as a separate item.
2. Each item corresponds to one named audience segment, ad set, or profile — not the top-level campaign name.
3. Infer psychographics and pain points from the copy examples and product context if not stated explicitly.
4. Map ad placement names to lowercase platform names: "instagram", "facebook", "tiktok", "youtube", "linkedin", "twitter".
5. Preserve copy examples verbatim, including their original language.
6. Keep all text fields in their original language (Polish, German, etc. — do not translate).
7. Return ONLY valid JSON — a top-level array. No explanation, no markdown fences.

DOCUMENT:
${rawDocument}

Return a JSON array where each item has this exact shape:
[
  {
    "suggestedName": "Campaign name — Segment label",
    "campaignGoal": "Awareness | Conversion | Engagement | Traffic",
    "strategyNarrative": "1-2 sentence description of this segment's objective and approach",
    "audience": {
      "demographics": "Age, gender, location, language as a prose sentence",
      "psychographics": "Interests, values, lifestyle inferred from document",
      "painPoints": "What problem does the product solve for this audience",
      "channels": ["facebook", "instagram"]
    },
    "brand": {
      "name": "Product or brand name from copy",
      "tone": "professional | friendly | bold | playful | inspirational | urgent",
      "colors": [],
      "fonts": []
    },
    "dailyBudget": "40 PLN",
    "adFormats": ["static image 1080x1080", "video 9:16"],
    "copyExamples": [
      { "language": "PL", "text": "First 200 chars of the copy example..." }
    ],
    "sourceSegmentLabel": "Original segment/adset label from the document",
    "documentTitle": "Top-level campaign or document title if identifiable"
  }
]`,
      },
    ],
  });

  const text = getText(response);
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Claude returned no campaign data from the document');

  const parsed = JSON.parse(jsonMatch[0]) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Claude returned unexpected format — expected an array');
  if (parsed.length === 0) throw new Error('No campaigns found in document');

  return parsed as ParsedCampaignSuggestion[];
}

// ─── Banner suggestions ───────────────────────────────────────────────────────

export interface BannerSuggestions {
  headlines: string[];
  subheadlines: string[];
  ctas: string[];
  colorRecommendations: Array<{ gradientId: string; reason: string }>;
  marketingAngles: Array<{ angle: string; headline: string; sub: string; cta: string }>;
}

export async function generateBannerSuggestions(
  brandInfo: string,
  gradientNames: string,
  styleContext?: string,
): Promise<BannerSuggestions> {
  console.log(`[claude] generateBannerSuggestions brandInfo="${brandInfo.slice(0, 60)}..." hasStyle=${!!styleContext}`);
  const styleClause = styleContext
    ? `\n\nBrand style guidelines (follow these in your suggestions):\n${styleContext}`
    : '';
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a creative marketing strategist specialised in visual ad design.
Given this brand information, generate compelling banner ad suggestions.${styleClause}

Brand info:
${brandInfo}

Available gradient IDs (use ONLY these exact strings, pick the most fitting 3): ${gradientNames}

Return ONLY valid JSON with this exact shape, no other text:
{
  "headlines": ["...", "...", "...", "...", "..."],
  "subheadlines": ["...", "...", "...", "...", "..."],
  "ctas": ["...", "...", "...", "...", "..."],
  "colorRecommendations": [
    { "gradientId": "<id>", "reason": "one sentence why this fits the brand" },
    { "gradientId": "<id>", "reason": "one sentence why this fits the brand" },
    { "gradientId": "<id>", "reason": "one sentence why this fits the brand" }
  ],
  "marketingAngles": [
    { "angle": "Urgency", "headline": "...", "sub": "...", "cta": "..." },
    { "angle": "Social Proof", "headline": "...", "sub": "...", "cta": "..." },
    { "angle": "Value Proposition", "headline": "...", "sub": "...", "cta": "..." }
  ]
}`,
    }],
  });
  const text = getText(response);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude did not return valid JSON for banner suggestions');
  return JSON.parse(match[0]) as BannerSuggestions;
}

// ─── Banner HTML generation ───────────────────────────────────────────────────

export interface GeneratedBannerHtml {
  html: string;
  desc: string;
}

export async function generateBannerHtml(
  brandInfo: string,
  count: number,
  refinement?: string,
  styleContext?: string,
): Promise<GeneratedBannerHtml[]> {
  console.log(`[claude] generateBannerHtml count=${count} hasRefinement=${!!refinement} hasStyle=${!!styleContext}`);

  const refinementClause = refinement
    ? `\n\nUser refinement request: "${refinement}"\nApply this change across all banners.`
    : '';
  const styleClause = styleContext
    ? `\n\nBrand style guidelines:\n${styleContext}`
    : '';

  const response = await getClient().messages.create(
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 8192, // each banner is ~3-4k tokens; use the full budget
      messages: [{
        role: 'user',
        content: `You are a creative ad designer. Generate exactly ${count} banner ad variation(s) as HTML.${styleClause}${refinementClause}

Brand:
${brandInfo}

Rules:
- Each banner: a single <div> with width:600px;height:600px and ALL styles inline.
- Available fonts (already loaded): Montserrat, Poppins, Raleway, Oswald, Playfair Display, Lato
- Background: CSS gradient only (no images, no external URLs).
- Include headline, subheadline, CTA button. High contrast text.
- Each variation: different color palette, font, layout.
- No <style> tags. No JavaScript. No animations.

Return ONLY valid JSON, no markdown:
[{"html":"<div style=\\"width:600px;height:600px;...\\">...</div>","desc":"brief style description"}]`,
      }],
    },
    { timeout: 90_000 }, // 90 s hard timeout on the Anthropic SDK call
  );

  const text = getText(response);
  console.log(`[claude] generateBannerHtml raw response (first 300 chars): ${text.slice(0, 300)}`);

  // Strip markdown code fences if present
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  const match = stripped.match(/\[[\s\S]*\]/);
  if (!match) {
    console.error('[claude] generateBannerHtml: no JSON array found in response');
    console.error('[claude] Full response:', text);
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch (e) {
    console.error('[claude] generateBannerHtml: JSON.parse failed:', (e as Error).message);
    console.error('[claude] Attempted to parse:', match[0].slice(0, 500));
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return (parsed as unknown[])
    .filter((item): item is GeneratedBannerHtml =>
      typeof item === 'object' && item !== null &&
      typeof (item as Record<string, unknown>).html === 'string' &&
      typeof (item as Record<string, unknown>).desc === 'string'
    )
    .slice(0, count);
}

// ─── Banner variation generation ──────────────────────────────────────────────

const VALID_GRADIENT_IDS = ['royal','sunset','ocean','fire','forest','midnight',
  'rose','sage','gold','carbon','aurora','deep','peach','spring','wine','ice'] as const;
const VALID_FONT_IDS = ['modern','elegant','impact','minimal','luxe','dynamic'] as const;
const VALID_POSITION_IDS = ['center','bottom-left','bottom-center','top-left'] as const;

const BannerVariationSpecSchema = z.object({
  headline:    z.string().min(1).max(120),
  subheadline: z.string().max(200),
  cta:         z.string().max(60),
  showSub:     z.boolean(),
  showCta:     z.boolean(),
  gradientId:  z.enum(VALID_GRADIENT_IDS),
  fontId:      z.enum(VALID_FONT_IDS),
  positionId:  z.enum(VALID_POSITION_IDS),
});

export type BannerVariationSpec = z.infer<typeof BannerVariationSpecSchema>;

const FALLBACK_VARIATION: BannerVariationSpec = {
  headline:    'Your Brand',
  subheadline: 'Discover the difference',
  cta:         'Get Started',
  showSub:     true,
  showCta:     true,
  gradientId:  'royal',
  fontId:      'modern',
  positionId:  'center',
};

const MODE_DESCRIPTIONS: Record<string, string> = {
  fresh:     'Fresh generation — maximum variety across all visual dimensions. Explore the full range of color palettes and font styles.',
  similar:   'Similar style — match the aesthetic direction of the source banner. Stay within the same color temperature and typographic weight class but create entirely new copy.',
  different: 'Contrasting style — deliberately subvert the source banner\'s aesthetic. Invert the mood, switch color register (dark ↔ light), and use a contrasting font personality.',
};

export async function generateBannerVariationsFromClaude(
  brandInfo: string,
  count: number,
  mode: 'fresh' | 'similar' | 'different',
  styleContext?: string,
  sourceVariation?: BannerVariationSpec,
): Promise<BannerVariationSpec[]> {
  console.log(`[claude] generateBannerVariations count=${count} mode=${mode} hasStyle=${!!styleContext} hasSource=${!!sourceVariation}`);

  const styleClause = styleContext
    ? `\n\nBrand style guidelines (follow these):\n${styleContext}`
    : '';
  const sourceClause = (mode !== 'fresh' && sourceVariation)
    ? `\nSource banner to reference:\n${JSON.stringify(sourceVariation)}\n`
    : '';

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: count <= 6 ? 2048 : 3072,
    messages: [{
      role: 'user',
      content: `You are a senior creative director specialised in digital advertising.
Generate exactly ${count} complete banner ad specifications.${styleClause}

Brand information:
${brandInfo}

Generation mode: ${MODE_DESCRIPTIONS[mode]}
${sourceClause}
CONSTRAINTS — you MUST use only these exact string values:
gradientId: ${VALID_GRADIENT_IDS.map(v => `"${v}"`).join('|')}
fontId: ${VALID_FONT_IDS.map(v => `"${v}"`).join('|')}
positionId: ${VALID_POSITION_IDS.map(v => `"${v}"`).join('|')}

RULES:
1. Every banner must have a distinct headline — no duplicates across the array.
2. Vary gradients across banners — avoid using the same gradientId more than twice.
3. Match the generation mode's aesthetic direction in your gradient and font choices.
4. Headlines: max 8 words, punchy, no full stops.
5. Subheadlines: max 15 words, one clear benefit statement.
6. CTAs: max 4 words, imperative verb + noun.
7. For 'similar' mode: keep the same visual family (color temperature, font weight class) but generate fresh copy and minor visual variations.
8. For 'different' mode: deliberately contrast the source — if source used a dark gradient choose light ones; if it used a bold font choose an elegant one; flip position.

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "headline": "...",
    "subheadline": "...",
    "cta": "...",
    "showSub": true,
    "showCta": true,
    "gradientId": "...",
    "fontId": "...",
    "positionId": "..."
  }
]`,
    }],
  });

  const text = getText(response);
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    console.warn('[claude] generateBannerVariations: no JSON array found, returning fallbacks');
    return Array.from({ length: count }, () => ({ ...FALLBACK_VARIATION }));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    console.warn('[claude] generateBannerVariations: JSON parse failed, returning fallbacks');
    return Array.from({ length: count }, () => ({ ...FALLBACK_VARIATION }));
  }

  if (!Array.isArray(parsed)) {
    return Array.from({ length: count }, () => ({ ...FALLBACK_VARIATION }));
  }

  // Validate each item, replace invalid ones with fallback
  const validated: BannerVariationSpec[] = (parsed as unknown[]).map((item) => {
    const result = BannerVariationSpecSchema.safeParse(item);
    return result.success ? result.data : { ...FALLBACK_VARIATION };
  });

  // Pad or trim to exactly `count` items
  while (validated.length < count) validated.push({ ...FALLBACK_VARIATION });
  return validated.slice(0, count);
}
