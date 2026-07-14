/** Premium Ask AI tokens — aligned with PREMIUM navy/gold shell. */
import type { ViewStyle } from 'react-native';
import { PREMIUM } from '../premium/premiumStyles';
import { platformShadow } from '../../utils/platformShadow';

export const AI_UI = {
  primary: PREMIUM.accent,
  primaryDark: '#1A1F3B',
  primaryLight: PREMIUM.accentSoft,
  primaryMuted: '#87889A',
  bg: PREMIUM.bg,
  bgTop: '#F9F6EF',
  bgBottom: '#EDE8DC',
  card: '#FFFFFF',
  ink: PREMIUM.ink,
  body: '#41435A',
  sub: '#87889A',
  gold: PREMIUM.gold,
  goldDeep: PREMIUM.goldDeep,
  goldSoft: PREMIUM.goldSoft,
  goldBorder: '#EADFC4',
  gradientEnd: '#2E3766',
  headerGradient: PREMIUM.headerGradient,
  heroGradient: ['#343D6E', '#2A325C', '#1F2648'] as const,
  border: 'rgba(35,42,77,0.1)',
  borderStrong: 'rgba(35,42,77,0.18)',
  shellRadius: 28,
  cardRadius: 20,
  bubbleRadius: 18,
  composerRadius: 20,
} as const;

export const aiPressFeedback = {
  opacity: 0.94,
  transform: [{ scale: 0.985 }] as const,
};

/** Rounded feed shell below the navy header. */
export function aiChatShell(extra?: ViewStyle): ViewStyle {
  return {
    flex: 1,
    marginTop: -18,
    zIndex: 2,
    borderTopLeftRadius: AI_UI.shellRadius,
    borderTopRightRadius: AI_UI.shellRadius,
    backgroundColor: AI_UI.bg,
    overflow: 'hidden',
    ...platformShadow({
      color: AI_UI.primary,
      offsetY: -6,
      opacity: 0.1,
      radius: 16,
      elevation: 8,
    }),
    ...extra,
  };
}

/** Elevated white card for prompts and composer. */
export function aiPremiumCard(extra?: ViewStyle): ViewStyle {
  return {
    backgroundColor: AI_UI.card,
    borderRadius: AI_UI.cardRadius,
    borderWidth: 1,
    borderColor: AI_UI.border,
    ...platformShadow({
      color: AI_UI.primary,
      offsetY: 6,
      opacity: 0.08,
      radius: 18,
      elevation: 3,
    }),
    ...extra,
  };
}
