import type { ViewStyle } from 'react-native';
import type { Theme } from '../../theme/types';
import { platformShadow } from '../../utils/platformShadow';

/** Premium v4 — "Classic Premium" navy/gold/sage design tokens (reference UI). */
export const PREMIUM = {
  bg: '#F4F1E9',
  cardRadius: 22,
  bodyLift: -34,
  headerGradient: ['#2E3766', '#232A4D', '#1A1F3B'] as const,
  heroGradient: ['#2E3766', '#232A4D', '#1A1F3B'] as const,
  sectionLabel: '#B3B4C2',
  hairline: '#F3F0E8',
  tabBottomPadding: 120,
  stackBottomPadding: 32,
  accent: '#232A4D',
  accentSoft: '#E9EBF3',
  gold: '#C29A4E',
  goldDeep: '#A67C33',
  goldSoft: '#F4EBD8',
  sage: '#5F8A7B',
  sageDeep: '#4C7264',
  sageSoft: '#E4EDE9',
  ink: '#1C1E2E',
} as const;

/** @deprecated use PREMIUM — kept for Home/Profile imports */
export const HOME_V2 = PREMIUM;

/** Elevated white card — premium shadow. */
export function premiumCard(theme: Theme): ViewStyle {
  return {
    backgroundColor: theme.colors.surface.default,
    borderRadius: PREMIUM.cardRadius,
    borderWidth: 1,
    borderColor: 'rgba(236,232,221,0.9)',
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
