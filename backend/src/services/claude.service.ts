import Anthropic from '@anthropic-ai/sdk';
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
  const response = await getClient().messages.create({
    model: 'claude-opus-4-5',
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
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Claude response');
  return JSON.parse(jsonMatch[0]) as StructuredBrief;
}

export async function generateCopy(
  brief: StructuredBrief,
  platform: string,
  instruction?: string
): Promise<string> {
  const instructionClause = instruction
    ? `\n\nUser refinement instruction: "${instruction}". Apply this to the output.`
    : '';

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Write compelling marketing copy for ${platform} based on this campaign brief:

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
  instruction?: string
): Promise<GsapAnimationConfig> {
  const instructionClause = instruction
    ? `\n\nUser refinement: "${instruction}". Apply this to the animation.`
    : '';

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Create a GSAP animation configuration for a ${platform} ad.

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
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-5',
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
  const response = await getClient().messages.create({
    model: 'claude-opus-4-5',
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
): Promise<BannerSuggestions> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a creative marketing strategist specialised in visual ad design.
Given this brand information, generate compelling banner ad suggestions.

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
