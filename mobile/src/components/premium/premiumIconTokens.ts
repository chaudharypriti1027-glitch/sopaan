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

/** Menu / profile row icon tints (maps legacy tone names). */
export const MENU_TONE_STYLES = {
  indigo: PREMIUM_ICON_TONES.lavender,
  teal: PREMIUM_ICON_TONES.mint,
  gold: PREMIUM_ICON_TONES.gold,
  coral: PREMIUM_ICON_TONES.coral,
} as const;

export type PremiumIconSize = 'sm' | 'md' | 'lg';

export const PREMIUM_ICON_SIZES: Record<
  PremiumIconSize,
  { box: number; radius: number; icon: number; stroke: number }
> = {
  sm: { box: 36, radius: 12, icon: 18, stroke: 2 },
  md: { box: 44, radius: 14, icon: 22, stroke: 2 },
  lg: { box: 52, radius: 18, icon: 26, stroke: 2.1 },
};

export type PremiumIconProps = {
  Icon: LucideIcon;
  tone?: PremiumIconTone;
  size?: PremiumIconSize;
  active?: boolean;
  filled?: boolean;
};
