import { buildTypography } from './buildTypography';
import { themeFonts } from './fonts';
import { a11y, colors, radii, shadows, spacing } from './tokens';
import type { Theme } from './types';

export const lightTheme: Theme = {
  mode: 'light',
  a11y,
  spacing,
  radii,
  typography: buildTypography(themeFonts),
  colors: {
    background: {
      primary: colors.boardCanvas,
      secondary: colors.white,
      elevated: colors.white,
    },
    surface: {
      default: colors.white,
      muted: colors.boardLine2,
    },
    text: {
      primary: colors.boardInk,
      secondary: colors.boardMuted,
      tertiary: colors.boardFaint,
      inverse: colors.white,
      link: colors.boardPrimary,
    },
    border: {
      default: colors.boardLine,
      subtle: colors.boardLine2,
    },
    brand: {
      primary: colors.boardPrimary,
      primaryHover: colors.boardPrimaryDeep,
      primaryMuted: colors.boardPrimarySoft,
      onPrimary: colors.white,
    },
    semantic: {
      success: colors.boardTeal,
      successMuted: colors.boardTealSoft,
      warning: colors.boardGold,
      warningMuted: colors.boardGoldSoft,
      error: colors.boardCoral,
      errorMuted: colors.boardCoralSoft,
      info: colors.boardPrimary,
      infoMuted: colors.boardPrimarySoft,
    },
    tabBar: {
      background: colors.white,
      border: colors.boardLine,
      inactive: colors.boardFaint,
      active: colors.boardPrimary,
    },
    fab: {
      background: colors.boardPrimary,
      foreground: colors.white,
      shadow: colors.boardPrimaryDeep,
    },
    accent: {
      gold: colors.boardGold,
      goldMuted: colors.boardGoldSoft,
      goldOn: colors.boardGoldDeep,
      teal: colors.boardTeal,
      tealMuted: colors.boardTealSoft,
      tealOn: colors.boardTeal,
      coral: colors.boardCoral,
      coralMuted: colors.boardCoralSoft,
      coralOn: colors.boardCoral,
    },
    shadow: {
      color: colors.boardPrimaryDeep,
    },
  },
  shadows,
};
