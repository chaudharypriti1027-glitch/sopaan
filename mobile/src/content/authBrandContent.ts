import type { LucideIcon } from 'lucide-react-native';
import {
  Flame,
  Gamepad2,
  ListChecks,
  Sparkles,
  WifiOff,
} from 'lucide-react-native';

/** Shared brand value chips shown on welcome / login / OTP heroes. */
export const AUTH_BRAND_VALUES = [
  { key: 'ai', icon: ListChecks, labelKey: 'brand.valueAi' },
  { key: 'games', icon: Gamepad2, labelKey: 'brand.valueGames' },
  { key: 'coach', icon: Sparkles, labelKey: 'brand.valueCoach' },
] as const;

/** Welcome screen feature grid — keys map to `welcome.features.*` i18n. */
export const WELCOME_FEATURES = [
  { key: 'ai', Icon: Sparkles, tone: 'sage' as const, bg: 'sage' as const },
  { key: 'games', Icon: Gamepad2, tone: 'accent' as const, bg: 'accent' as const },
  { key: 'streak', Icon: Flame, tone: 'gold' as const, bg: 'gold' as const },
  { key: 'offline', Icon: WifiOff, tone: 'accentDeep' as const, bg: 'accent' as const },
] as const;

export type AuthHeroVariant = 'welcome' | 'login' | 'otp' | 'verify' | 'signup' | 'profile';

type HeroVariantConfig = {
  badgeKey: string;
  titleKey?: string;
  subtitleKey: string;
  showWordmark: boolean;
  showValueChips: boolean;
  showMotivation: boolean;
  testID: string;
};

/** Maps each auth screen hero to shared i18n keys. */
export const AUTH_HERO_VARIANTS: Record<AuthHeroVariant, HeroVariantConfig> = {
  welcome: {
    badgeKey: 'brand.premiumBadge',
    subtitleKey: 'brand.tagline',
    showWordmark: true,
    showValueChips: false,
    showMotivation: false,
    testID: 'welcome-hero',
  },
  login: {
    badgeKey: 'brand.secureBadge',
    subtitleKey: 'login.brandSubtitle',
    showWordmark: true,
    showValueChips: false,
    showMotivation: false,
    testID: 'login-hero',
  },
  otp: {
    badgeKey: 'brand.secureBadge',
    subtitleKey: 'otp.heroSubtitle',
    showWordmark: true,
    showValueChips: false,
    showMotivation: false,
    testID: 'otp-hero',
  },
  verify: {
    badgeKey: 'brand.secureBadge',
    titleKey: 'otp.verifyTitle',
    subtitleKey: 'otp.verifyHeroSubtitle',
    showWordmark: false,
    showValueChips: false,
    showMotivation: false,
    testID: 'otp-verify-hero',
  },
  signup: {
    badgeKey: 'brand.premiumBadge',
    titleKey: 'signup.heroTitle',
    subtitleKey: 'signup.heroSubtitle',
    showWordmark: false,
    showValueChips: false,
    showMotivation: false,
    testID: 'signup-hero',
  },
  profile: {
    badgeKey: 'brand.premiumBadge',
    titleKey: 'signup.postOtpTitle',
    subtitleKey: 'signup.postOtpSubtitle',
    showWordmark: false,
    showValueChips: false,
    showMotivation: false,
    testID: 'signup-profile-hero',
  },
};

export type WelcomeFeatureTone = (typeof WELCOME_FEATURES)[number]['tone'];

export function welcomeFeatureIcon(key: string): LucideIcon | undefined {
  return WELCOME_FEATURES.find((item) => item.key === key)?.Icon;
}
