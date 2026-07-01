/**
 * Design tokens — Sopaan "Classic Premium" board (sopaan-home-classic.html).
 * Semantic mappings live in lightTheme.ts / darkTheme.ts.
 */

export const colors = {
  boardPrimary: '#232A4D',
  boardPrimaryDeep: '#1A1F3B',
  boardPrimarySoft: '#E9EBF3',
  boardGold: '#C29A4E',
  boardGoldDeep: '#A67C33',
  boardGoldSoft: '#F4EBD8',
  boardTeal: '#5F8A7B',
  boardTealSoft: '#E4EDE9',
  boardCoral: '#C4634F',
  boardCoralSoft: '#F5E2DC',
  boardCanvas: '#F4F1E9',
  boardInk: '#1C1E2E',
  boardInk2: '#41435A',
  boardMuted: '#87889A',
  boardFaint: '#B3B4C2',
  boardLine: '#ECE8DD',
  boardLine2: '#F3F0E8',

  indigo50: '#E9EBF3',
  indigo100: '#DBDEEA',
  indigo200: '#C0C4DB',
  indigo300: '#9BA1C4',
  indigo400: '#6B729E',
  indigo500: '#454C79',
  indigo600: '#2E3766',
  indigo700: '#232A4D',
  indigo800: '#1A1F3B',
  indigo900: '#1C1E2E',

  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
  slate950: '#020617',

  emerald50: '#ECFDF5',
  emerald500: '#10B981',
  emerald600: '#059669',
  emerald900: '#064E3B',
  amber50: '#FFFBEB',
  amber500: '#F59E0B',
  amber600: '#D97706',
  amber900: '#78350F',
  red50: '#FEF2F2',
  red500: '#EF4444',
  red600: '#DC2626',
  red900: '#7F1D1D',
  blue50: '#EFF6FF',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue900: '#1E3A8A',

  gold50: '#F4EBD8',
  gold500: '#C29A4E',
  gold600: '#A67C33',

  teal50: '#E4EDE9',
  teal500: '#5F8A7B',
  teal600: '#4C7264',
  teal900: '#2C453D',

  coral50: '#F5E2DC',
  coral500: '#C4634F',
  coral600: '#A8503E',
  coral900: '#5E2C22',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/** Core spacing scale (px). */
export const spacingScale = [4, 8, 12, 16, 18, 24] as const;

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  lgPlus: 18,
  xl: 24,
  /** @deprecated prefer `xl` (24) */
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  button: 14,
  card: 22,
  pill: 999,
  /** @deprecated use `pill` */
  full: 999,
  xl: 16,
  '2xl': 24,
} as const;

export const shadows = {
  card: {
    shadowColor: '#232A4D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 5,
  },
} as const;

export const a11y = {
  minTouchTarget: 44,
  maxFontSizeMultiplier: 1.5,
  maxFontSizeMultiplierDense: 1.35,
} as const;

export const typographyScale = {
  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 22,
    '3xl': 28,
    '4xl': 34,
    '5xl': 40,
  },
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.625,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
} as const;
