import { colors, radii, spacing, typographyScale } from '../theme/tokens';

/** Fixed palette for share cards — always indigo + gold regardless of app theme. */
export const shareCardTokens = {
  width: 360,
  height: 450,
  colors: {
    background: colors.indigo900,
    backgroundAccent: colors.indigo700,
    surface: colors.indigo800,
    gold: colors.gold500,
    goldDeep: colors.gold600,
    goldMuted: colors.gold50,
    textPrimary: colors.white,
    textSecondary: colors.indigo200,
    textMuted: colors.indigo300,
    border: colors.indigo700,
  },
  spacing,
  radii,
  typography: typographyScale,
} as const;
