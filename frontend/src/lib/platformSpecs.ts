import type { Platform, PlatformSpec } from '@/types/generation.types';

export const PLATFORM_SPECS: Record<Platform, PlatformSpec> = {
  instagram: {
    displayName: 'Instagram',
    color: '#E1306C',
    aspectRatios: ['1:1', '4:5', '9:16'],
    maxCopyLength: 2200,
    videoMaxDuration: 60,
  },
  facebook: {
    displayName: 'Facebook',
    color: '#1877F2',
    aspectRatios: ['1:1', '16:9', '4:5'],
    maxCopyLength: 63206,
    videoMaxDuration: 240,
  },
  tiktok: {
    displayName: 'TikTok',
    color: '#010101',
    aspectRatios: ['9:16'],
    maxCopyLength: 150,
    videoMaxDuration: 180,
  },
  youtube: {
    displayName: 'YouTube',
    color: '#FF0000',
    aspectRatios: ['16:9'],
    maxCopyLength: 5000,
    videoMaxDuration: 600,
  },
  twitter: {
    displayName: 'Twitter/X',
    color: '#1DA1F2',
    aspectRatios: ['16:9', '1:1'],
    maxCopyLength: 280,
    videoMaxDuration: 140,
  },
  linkedin: {
    displayName: 'LinkedIn',
    color: '#0A66C2',
    aspectRatios: ['1:1', '1.91:1'],
    maxCopyLength: 3000,
    videoMaxDuration: 600,
  },
};

export const PLATFORMS = Object.keys(PLATFORM_SPECS) as Platform[];
