import type { CSSProperties } from 'vue';
import { GRADIENTS, FONT_PAIRS, POSITIONS } from '@/constants/bannerPresets';

export interface BannerVariationStyle {
  headline: string;
  subheadline: string;
  cta: string;
  showSub: boolean;
  showCta: boolean;
  gradientId: string;
  fontId: string;
  positionId: string;
}

export function getGradient(v: BannerVariationStyle) {
  return GRADIENTS.find(g => g.id === v.gradientId) ?? GRADIENTS[0];
}

export function getFont(v: BannerVariationStyle) {
  return FONT_PAIRS.find(f => f.id === v.fontId) ?? FONT_PAIRS[0];
}

export function getPosition(v: BannerVariationStyle) {
  return POSITIONS.find(p => p.id === v.positionId) ?? POSITIONS[0];
}

export function isLightText(v: BannerVariationStyle): boolean {
  return !getGradient(v).dark;
}

function textColor(light: boolean): string  { return light ? '#ffffff' : '#1a1a1a'; }
function ctaBg(light: boolean): string      { return light ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)'; }
function ctaBorder(light: boolean): string  { return light ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.22)'; }
function textShadow(light: boolean): string { return light ? '0 1px 6px rgba(0,0,0,0.4)' : '0 1px 4px rgba(255,255,255,0.3)'; }

export function varBannerStyle(v: BannerVariationStyle): CSSProperties {
  return { background: getGradient(v).css };
}

export function varHeadlineStyle(v: BannerVariationStyle, small = false): CSSProperties {
  const light = isLightText(v);
  const font  = getFont(v);
  return {
    fontFamily:    `'${font.heading}', sans-serif`,
    fontWeight:    font.weight,
    fontSize:      small ? '18px' : '42px',
    lineHeight:    '1.1',
    color:         textColor(light),
    textShadow:    textShadow(light),
    textAlign:     getPosition(v).textAlign as CanvasTextAlign,
    letterSpacing: v.fontId === 'impact' ? '0.02em' : '-0.01em',
    margin:        '0',
    wordBreak:     'break-word',
  };
}

export function varSubStyle(v: BannerVariationStyle, small = false): CSSProperties {
  const light = isLightText(v);
  const font  = getFont(v);
  return {
    fontFamily: `'${font.body}', sans-serif`,
    fontWeight:  400,
    fontSize:    small ? '10px' : '18px',
    lineHeight:  '1.4',
    color:       textColor(light),
    textShadow:  textShadow(light),
    textAlign:   getPosition(v).textAlign as CanvasTextAlign,
    opacity:     0.88,
    margin:      '0',
  };
}

export function varCtaStyle(v: BannerVariationStyle, small = false): CSSProperties {
  const light = isLightText(v);
  const font  = getFont(v);
  return {
    display:       'inline-block',
    fontFamily:    `'${font.body}', sans-serif`,
    fontWeight:    600,
    fontSize:      small ? '8px' : '14px',
    color:         textColor(light),
    background:    ctaBg(light),
    border:        `1px solid ${ctaBorder(light)}`,
    borderRadius:  '9999px',
    padding:       small ? '4px 10px' : '8px 20px',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    alignSelf:     getPosition(v).textAlign === 'center' ? 'center' : 'flex-start',
    marginTop:     small ? '2px' : '4px',
    whiteSpace:    'nowrap',
  };
}

export function varPositionClasses(v: BannerVariationStyle): string {
  return `absolute inset-0 flex flex-col gap-1.5 p-4 ${getPosition(v).flex}`;
}
