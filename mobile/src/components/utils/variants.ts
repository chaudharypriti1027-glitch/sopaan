import type { Theme } from '../../theme';

export type AccentVariant = 'primary' | 'gold' | 'teal' | 'coral' | 'soft';

export type AccentColorSet = {
  main: string;
  muted: string;
  on: string;
};

export function getAccentColors(theme: Theme, variant: AccentVariant): AccentColorSet {
  switch (variant) {
    case 'gold':
      return {
        main: theme.colors.accent.gold,
        muted: theme.colors.accent.goldMuted,
        on: theme.colors.accent.goldOn,
      };
    case 'teal':
      return {
        main: theme.colors.accent.teal,
        muted: theme.colors.accent.tealMuted,
        on: theme.colors.accent.tealOn,
      };
    case 'coral':
      return {
        main: theme.colors.accent.coral,
        muted: theme.colors.accent.coralMuted,
        on: theme.colors.accent.coralOn,
      };
    case 'soft':
      return {
        main: theme.colors.surface.muted,
        muted: theme.colors.surface.muted,
        on: theme.colors.text.secondary,
      };
    case 'primary':
    default:
      return {
        main: theme.colors.brand.primary,
        muted: theme.colors.brand.primaryMuted,
        on: theme.colors.brand.primary,
      };
  }
}
