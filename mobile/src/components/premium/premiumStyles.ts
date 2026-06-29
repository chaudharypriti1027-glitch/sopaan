import type { ViewStyle } from 'react-native';
import type { Theme } from '../../theme/types';

/** Premium v2 design tokens — shared across Home, Profile, and all screens. */
export const PREMIUM = {
  bg: '#F4F6FB',
  cardRadius: 22,
  bodyLift: -34,
  headerGradient: ['#4844E6', '#322EAE', '#221F84'] as const,
  sectionLabel: '#A2A5BC',
  hairline: '#F4F5FA',
  tabBottomPadding: 120,
  stackBottomPadding: 32,
} as const;

/** @deprecated use PREMIUM — kept for Home/Profile imports */
export const HOME_V2 = PREMIUM;

/** Elevated white card — premium shadow. */
export function premiumCard(theme: Theme): ViewStyle {
  return {
    backgroundColor: theme.colors.surface.default,
    borderRadius: PREMIUM.cardRadius,
    borderWidth: 0,
    shadowColor: theme.colors.shadow.color,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 34,
    elevation: 6,
  };
}

/** @deprecated use premiumCard */
export const homePremiumCard = premiumCard;

/** Soft tile shadow for action squares. */
export function premiumTileShadow(theme: Theme): ViewStyle {
  return {
    shadowColor: theme.colors.shadow.color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  };
}

/** @deprecated use premiumTileShadow */
export const homeTileShadow = premiumTileShadow;

/** Colored glow for FAB / avatar on gradient headers. */
export function premiumGlowShadow(color: string): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  };
}

/** @deprecated use premiumGlowShadow */
export const homeGlowShadow = premiumGlowShadow;

/** Floating tab bar pill shadow. */
export function premiumNavShadow(theme: Theme): ViewStyle {
  return {
    shadowColor: theme.colors.shadow.color,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 12,
  };
}

/** @deprecated use premiumNavShadow */
export const homeNavShadow = premiumNavShadow;
