import type { ViewStyle } from 'react-native';
import type { Theme } from '../../theme/types';
import { platformShadow } from '../../utils/platformShadow';

/** Premium tokens — aligned with home navy / cream / gold system. */
export const PREMIUM = {
  bg: '#F3EEE1',
  cardRadius: 24,
  bodyLift: -34,
  headerGradient: ['#2C3568', '#1C2450', '#131A3C'] as const,
  heroGradient: ['#2C3568', '#1C2450', '#131A3C'] as const,
  sectionLabel: '#8B8FA3',
  hairline: '#F0EBDD',
  tabBottomPadding: 120,
  stackBottomPadding: 32,
  accent: '#1E2A55',
  accentSoft: '#EAEDF6',
  gold: '#C9A24B',
  goldLt: '#E9CF8D',
  goldDeep: '#A67F2E',
  goldSoft: '#FAF4E3',
  goldBorder: '#EFE3C3',
  sage: '#5E9C7C',
  sageDeep: '#4C7A63',
  sageSoft: '#E9F1EA',
  ink: '#1D2440',
  tileBg: '#FAF6EA',
  muted: '#8B8FA3',
} as const;

/** @deprecated use PREMIUM — kept for Home/Profile imports */
export const HOME_V2 = PREMIUM;

/** Elevated white card — premium shadow. */
export function premiumCard(theme: Theme): ViewStyle {
  return {
    backgroundColor: theme.colors.surface.default,
    borderRadius: PREMIUM.cardRadius,
    borderWidth: 1,
    borderColor: PREMIUM.goldBorder,
    ...platformShadow({
      color: theme.colors.shadow.color,
      offsetY: 8,
      opacity: 0.08,
      radius: 20,
      elevation: 4,
    }),
  };
}

/** @deprecated use premiumCard */
export const homePremiumCard = premiumCard;

/** Soft tile shadow for action squares. */
export function premiumTileShadow(theme: Theme): ViewStyle {
  return platformShadow({
    color: theme.colors.shadow.color,
    offsetY: 6,
    opacity: 0.09,
    radius: 16,
    elevation: 3,
  });
}

/** @deprecated use premiumTileShadow */
export const homeTileShadow = premiumTileShadow;

/** Colored glow for FAB / avatar on gradient headers. */
export function premiumGlowShadow(color: string): ViewStyle {
  return platformShadow({
    color,
    offsetY: 6,
    opacity: 0.35,
    radius: 14,
    elevation: 6,
  });
}

/** @deprecated use premiumGlowShadow */
export const homeGlowShadow = premiumGlowShadow;

/** Floating tab bar pill shadow. */
export function premiumNavShadow(theme: Theme): ViewStyle {
  return platformShadow({
    color: theme.colors.shadow.color,
    offsetY: 16,
    opacity: 0.16,
    radius: 32,
    elevation: 10,
  });
}

/** @deprecated use premiumNavShadow */
export const homeNavShadow = premiumNavShadow;
