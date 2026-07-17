/** Premium current affairs tokens — navy/gold, aligned with home feed. */
import type { ViewStyle } from 'react-native';
import { platformShadow } from '../../utils/platformShadow';

export const CA_UI = {
  bg: '#F3EEE1',
  surface: '#FFFFFF',
  border: '#EFE8D6',
  borderStrong: '#DBDEEA',
  text: '#1D2440',
  text2: '#41435A',
  muted: '#8B8FA3',
  faint: '#B3B4C2',
  accent: '#1C2450',
  accentSoft: '#EAEDF6',
  accentGradient: ['#2C3568', '#1C2450', '#131A3C'] as const,
  aiGradient: ['#2C3568', '#1C2450'] as const,
  gold: '#C9A24B',
  goldLt: '#E9CF8D',
  goldDeep: '#A67F2E',
  goldSoft: '#FAF4E3',
  goldBorder: '#EFE3C3',
  hot: '#C9A24B',
  sage: '#5E9C7C',
  examHigh: '#A8503E',
  examHighBg: '#F5E2DC',
  examHighBorder: '#EACBC0',
  examMed: '#A67F2E',
  examMedBg: '#F6EDDA',
  examMedBorder: '#EFE3C3',
  shadow: '#1C2450',
  cardRadius: 20,
  cardRadiusLg: 22,
  innerRadius: 14,
  bevelDark: '#E5DFCE',
  bevelLight: '#FAF7EE',
  heroGradient: ['#2C3568', '#1C2450', '#131A3C'] as const,
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
