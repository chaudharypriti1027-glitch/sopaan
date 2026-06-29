import { typographyScale } from './tokens';
import type { ThemeFonts, ThemeTypography } from './types';

function lineHeight(fontSize: number, multiplier: number): number {
  return Math.round(fontSize * multiplier);
}

export function buildTypography(fonts: ThemeFonts): ThemeTypography {
  const { fontSize, lineHeight: lh, letterSpacing } = typographyScale;

  return {
    scale: typographyScale,
    fonts,
    presets: {
      display: {
        fontFamily: fonts.stat.bold,
        fontSize: fontSize['5xl'],
        lineHeight: lineHeight(fontSize['5xl'], lh.tight),
        letterSpacing: letterSpacing.tight,
      },
      h1: {
        fontFamily: fonts.ui.bold,
        fontSize: fontSize['3xl'],
        lineHeight: lineHeight(fontSize['3xl'], lh.tight),
        letterSpacing: letterSpacing.tight,
      },
      h2: {
        fontFamily: fonts.ui.bold,
        fontSize: fontSize['2xl'],
        lineHeight: lineHeight(fontSize['2xl'], lh.snug),
      },
      h3: {
        fontFamily: fonts.ui.semibold,
        fontSize: fontSize.xl,
        lineHeight: lineHeight(fontSize.xl, lh.snug),
      },
      body: {
        fontFamily: fonts.ui.regular,
        fontSize: fontSize.base,
        lineHeight: lineHeight(fontSize.base, lh.normal),
      },
      bodyMedium: {
        fontFamily: fonts.ui.medium,
        fontSize: fontSize.base,
        lineHeight: lineHeight(fontSize.base, lh.normal),
      },
      caption: {
        fontFamily: fonts.ui.regular,
        fontSize: fontSize.base,
        lineHeight: lineHeight(fontSize.base, lh.normal),
      },
      label: {
        fontFamily: fonts.ui.medium,
        fontSize: fontSize.sm,
        lineHeight: lineHeight(fontSize.sm, lh.normal),
      },
      tabLabel: {
        fontFamily: fonts.ui.medium,
        fontSize: fontSize.sm,
        lineHeight: lineHeight(fontSize.sm, lh.snug),
      },
      fabLabel: {
        fontFamily: fonts.ui.semibold,
        fontSize: fontSize.sm,
        lineHeight: lineHeight(fontSize.sm, lh.snug),
      },
      stat: {
        fontFamily: fonts.stat.semibold,
        fontSize: fontSize.md,
        lineHeight: lineHeight(fontSize.md, lh.tight),
        letterSpacing: letterSpacing.tight,
      },
      statLarge: {
        fontFamily: fonts.stat.bold,
        fontSize: fontSize['4xl'],
        lineHeight: lineHeight(fontSize['4xl'], lh.tight),
        letterSpacing: letterSpacing.tight,
      },
      eyebrow: {
        fontFamily: fonts.ui.semibold,
        fontSize: fontSize.xs,
        lineHeight: lineHeight(fontSize.xs, lh.snug),
        letterSpacing: letterSpacing.wide,
      },
    },
  };
}
