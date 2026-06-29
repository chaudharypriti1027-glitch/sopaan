/**
 * Design tokens — Sopaan Design Board (sopaan-design-board.html).
 * Semantic mappings live in lightTheme.ts / darkTheme.ts.
 */

export const colors = {
  boardPrimary: '#3A36CC',
  boardPrimaryDeep: '#211E78',
  boardPrimarySoft: '#ECEBFB',
  boardGold: '#F2A516',
  boardGoldDeep: '#C97E00',
  boardGoldSoft: '#FDF1D8',
  boardTeal: '#10A593',
  boardTealSoft: '#DCF4F0',
  boardCoral: '#F2554B',
  boardCoralSoft: '#FDE3E1',
  boardCanvas: '#EBECF3',
  boardInk: '#16182A',
  boardInk2: '#3A3D55',
  boardMuted: '#6C6F88',
  boardFaint: '#9A9DB5',
  boardLine: '#E8E9F2',
  boardLine2: '#EFEFF6',

  indigo50: '#ECEBFB',
  indigo100: '#E0E7FF',
  indigo200: '#C7D2FE',
  indigo300: '#A5B4FC',
  indigo400: '#818CF8',
  indigo500: '#6366F1',
  indigo600: '#3A36CC',
  indigo700: '#211E78',
  indigo800: '#211E78',
  indigo900: '#16182A',

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

  gold50: '#FDF1D8',
  gold500: '#F2A516',
  gold600: '#C97E00',

  teal50: '#DCF4F0',
  teal500: '#10A593',
  teal600: '#0D9488',
  teal900: '#134E4A',

  coral50: '#FDE3E1',
  coral500: '#F2554B',
  coral600: '#E0453C',
  coral900: '#7C2D12',

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
    shadowColor: colors.boardPrimaryDeep,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 34,
    elevation: 6,
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
