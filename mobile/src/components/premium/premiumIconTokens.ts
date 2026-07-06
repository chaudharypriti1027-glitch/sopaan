import type { LucideIcon } from 'lucide-react-native';

/** Soft tinted icon tiles — matches "Classic Premium" navy/gold/sage reference UI. */
export const PREMIUM_ICON_TONES = {
  lavender: { bg: '#E9EBF3', fg: '#232A4D', ring: '#DBDEEA' },
  violet: { bg: '#DBDEEA', fg: '#1A1F3B', ring: '#C0C4DB' },
  gold: { bg: '#F4EBD8', fg: '#A67C33', ring: '#EADFC4' },
  mint: { bg: '#E4EDE9', fg: '#4C7264', ring: '#CFE0D9' },
  rose: { bg: '#F5E2DC', fg: '#A8503E', ring: '#EACBC0' },
  sky: { bg: '#E9EEF3', fg: '#3B4B6E', ring: '#D3DEEA' },
  slate: { bg: '#F3F0E8', fg: '#41435A', ring: '#ECE8DD' },
  coral: { bg: '#F5E2DC', fg: '#A8503E', ring: '#EACBC0' },
} as const;

export type PremiumIconTone = keyof typeof PREMIUM_ICON_TONES;

/** 3D bevel gradients per tone — top (light) → bottom (shadow). */
export const PREMIUM_ICON_3D: Record<
  PremiumIconTone,
  {
    top: string;
    mid: string;
    bottom: string;
    darkTop: string;
    darkMid: string;
    darkBottom: string;
  }
> = {
  lavender: {
    top: '#FFFFFF',
    mid: '#E9EBF3',
    bottom: '#B8BFD4',
    darkTop: '#525A80',
    darkMid: '#3E4568',
    darkBottom: '#2C3358',
  },
  violet: {
    top: '#F0F2F8',
    mid: '#DBDEEA',
    bottom: '#BFC5D6',
    darkTop: '#4C5478',
    darkMid: '#3C4464',
    darkBottom: '#2E3554',
  },
  gold: {
    top: '#FFF8E8',
    mid: '#F4EBD8',
    bottom: '#C9A85A',
    darkTop: '#D4B066',
    darkMid: '#B89442',
    darkBottom: '#8F7028',
  },
  mint: {
    top: '#F2F8F4',
    mid: '#E4EDE9',
    bottom: '#BFD5CB',
    darkTop: '#6A9A88',
    darkMid: '#568274',
    darkBottom: '#426A5C',
  },
  rose: {
    top: '#FCF2ED',
    mid: '#F5E2DC',
    bottom: '#E0C0B4',
    darkTop: '#C07866',
    darkMid: '#A86452',
    darkBottom: '#8C5040',
  },
  sky: {
    top: '#F4F8FB',
    mid: '#E9EEF3',
    bottom: '#C8D4E2',
    darkTop: '#5E7296',
    darkMid: '#4C6084',
    darkBottom: '#3A4E6E',
  },
  slate: {
    top: '#FCFAF4',
    mid: '#F3F0E8',
    bottom: '#D8D2C4',
    darkTop: '#64667C',
    darkMid: '#525468',
    darkBottom: '#404254',
  },
  coral: {
    top: '#FCF2ED',
    mid: '#F5E2DC',
    bottom: '#E0C0B4',
    darkTop: '#C07866',
    darkMid: '#A86452',
    darkBottom: '#8C5040',
  },
};

export const MENU_TONE_STYLES = {
  indigo: PREMIUM_ICON_TONES.lavender,
  teal: PREMIUM_ICON_TONES.mint,
  gold: PREMIUM_ICON_TONES.gold,
  coral: PREMIUM_ICON_TONES.coral,
} as const;

/** Tile sizes — `tile` is the full outer bevel dimension (no double boxing). */
export type PremiumIconSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg';

export const PREMIUM_ICON_SIZES: Record<
  PremiumIconSize,
  { tile: number; radius: number; icon: number; stroke: number }
> = {
  '2xs': { tile: 22, radius: 8, icon: 11, stroke: 2.2 },
  xs: { tile: 28, radius: 10, icon: 14, stroke: 2.2 },
  sm: { tile: 36, radius: 12, icon: 18, stroke: 2.2 },
  md: { tile: 44, radius: 14, icon: 22, stroke: 2.25 },
  lg: { tile: 52, radius: 16, icon: 26, stroke: 2.3 },
};

export type PremiumIconProps = {
  Icon: LucideIcon;
  tone?: PremiumIconTone;
  size?: PremiumIconSize;
  active?: boolean;
  filled?: boolean;
  depth?: boolean;
  surface?: 'light' | 'dark';
};

export function premiumIconGlyphColor(tone: PremiumIconTone, surface: 'light' | 'dark') {
  if (surface === 'dark') return '#FFFFFF';
  return PREMIUM_ICON_TONES[tone].fg;
}
