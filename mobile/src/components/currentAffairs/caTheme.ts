/** Premium current affairs tokens — navy/gold, aligned with home feed. */
import type { ViewStyle } from 'react-native';
import { platformShadow } from '../../utils/platformShadow';

export const CA_UI = {
  bg: '#F6F3EB',
  surface: '#FFFFFF',
  border: '#ECE8DD',
  borderStrong: '#DBDEEA',
  text: '#1C1E2E',
  text2: '#41435A',
  muted: '#87889A',
  faint: '#B3B4C2',
  accent: '#232A4D',
  accentSoft: '#E9EBF3',
  accentGradient: ['#2E3766', '#232A4D', '#1A1F3B'] as const,
  aiGradient: ['#2E3766', '#232A4D'] as const,
  gold: '#C29A4E',
  goldLt: '#E3C97F',
  goldDeep: '#A67C33',
  goldSoft: '#F4EBD8',
  goldBorder: '#EADFC4',
  hot: '#C29A4E',
  sage: '#5F8A7B',
  examHigh: '#A8503E',
  examHighBg: '#F5E2DC',
  examHighBorder: '#EACBC0',
  examMed: '#A67C33',
  examMedBg: '#F4EBD8',
  examMedBorder: '#EADFC4',
  shadow: '#232A4D',
  cardRadius: 20,
  cardRadiusLg: 22,
  innerRadius: 14,
  bevelDark: '#D8D2C6',
  bevelLight: '#F8F6F0',
  heroGradient: ['#343D6E', '#2A325C', '#1F2648'] as const,
} as const;

export const ca3dBevel: ViewStyle = {
  borderBottomWidth: 1,
  borderRightWidth: 1,
  borderBottomColor: CA_UI.bevelDark,
  borderRightColor: CA_UI.bevelDark,
};

export function caFeedCard(extra?: ViewStyle): ViewStyle {
  return {
    backgroundColor: CA_UI.surface,
    borderRadius: CA_UI.cardRadiusLg,
    borderWidth: 1,
    borderColor: CA_UI.border,
    borderTopColor: CA_UI.bevelLight,
    ...ca3dBevel,
    overflow: 'hidden',
    ...platformShadow({
      color: CA_UI.shadow,
      offsetY: 8,
      opacity: 0.1,
      radius: 18,
      elevation: 4,
    }),
    ...extra,
  };
}

export function caChip(extra?: ViewStyle): ViewStyle {
  return {
    backgroundColor: CA_UI.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CA_UI.border,
    borderTopColor: CA_UI.bevelLight,
    ...ca3dBevel,
    ...extra,
  };
}

export const caPressFeedback: ViewStyle = {
  opacity: 0.94,
  transform: [{ scale: 0.985 }],
};
