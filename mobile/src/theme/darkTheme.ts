import { buildTypography } from './buildTypography';
import { themeFonts } from './fonts';
import { a11y, colors, radii, shadows, spacing } from './tokens';
import type { Theme } from './types';

/**
 * Dark theme slot — semantic mappings for a future dark mode.
 * Not wired into ThemeProvider yet; swap in when dark mode ships.
 */
export const darkTheme: Theme = {
  mode: 'dark',
  a11y,
  spacing,
  radii,
  typography: buildTypography(themeFonts),
  colors: {
    background: {
      primary: colors.slate950,
      secondary: colors.slate900,
      elevated: colors.slate800,
    },
    surface: {
      default: colors.slate900,
      muted: colors.slate800,
    },
    text: {
      primary: colors.slate50,
      secondary: colors.slate400,
      tertiary: colors.slate500,
      inverse: colors.slate900,
      link: colors.indigo400,
    },
    border: {
      default: colors.slate700,
      subtle: colors.slate800,
    },
    brand: {
      primary: colors.indigo500,
      primaryHover: colors.indigo400,
      primaryMuted: colors.indigo900,
      onPrimary: colors.white,
    },
    semantic: {
      success: colors.emerald500,
      successMuted: colors.emerald900,
      warning: colors.amber500,
      warningMuted: colors.amber900,
      error: colors.red500,
      errorMuted: colors.red900,
      info: colors.blue500,
      infoMuted: colors.blue900,
    },
    tabBar: {
      background: colors.slate900,
      border: colors.slate700,
      inactive: colors.slate500,
      active: colors.indigo400,
    },
    fab: {
      background: colors.indigo500,
      foreground: colors.white,
      shadow: colors.indigo500,
    },
    accent: {
      gold: colors.gold500,
      goldMuted: colors.amber900,
      goldOn: colors.gold50,
      teal: colors.teal500,
      tealMuted: colors.teal900,
      tealOn: colors.teal50,
      coral: colors.coral500,
      coralMuted: colors.coral900,
      coralOn: colors.coral50,
    },
    shadow: {
      color: colors.black,
    },
  },
  shadows: {
    card: {
      ...shadows.card,
      shadowColor: colors.black,
      shadowOpacity: 0.2,
    },
  },
};
