/** Home tokens aligned to Sopaan Home Page HTML reference. */
import type { ViewStyle } from 'react-native';
import { FLOATING_TAB_BAR_BOTTOM_PADDING } from '../../navigation/tabBarConstants';
import { platformShadow } from '../../utils/platformShadow';

export const HOME_UI = {
  bg: '#F3EEE1',
  bgTop: '#F6F1E6',
  bgBottom: '#EDE7D8',
  surface: '#FFFFFF',
  ink: '#1D2440',
  muted: '#8B8FA3',
  border: '#F0EBDD',
  borderSoft: '#EFE8D6',
  accent: '#1E2A55',
  accentSoft: '#EAEDF6',
  accentGradient: ['#2A3466', '#161E44'] as const,
  gold: '#C9A24B',
  goldLt: '#E9CF8D',
  goldDeep: '#A67F2E',
  goldSoft: '#FAF4E3',
  goldBorder: '#EFE3C3',
  sage: '#5E9C7C',
  sageDeep: '#4C7A63',
  sageSoft: '#E9F1EA',
  shadow: '#181E3C',
  tileBg: '#FAF6EA',
  heroGradient: ['#2C3568', '#1C2450', '#131A3C'] as const,
  leagueGradient: ['#FCF7EA', '#F5EBD3'] as const,
  heroRadius: 32,
  cardRadius: 18,
  cardRadiusLg: 24,
  innerRadius: 14,
  horizontalPad: 16,
  feedTopPad: 8,
  feedHeroOverlap: 36,
  sectionGap: 28,
  sectionPanelPad: 14,
  tabBottomPad: FLOATING_TAB_BAR_BOTTOM_PADDING + 28,
  bevelDark: '#E5DFCE',
  bevelLight: '#FAF7EE',
} as const;

export const home3dBevel: ViewStyle = {
  borderBottomWidth: 1,
  borderRightWidth: 1,
  borderBottomColor: HOME_UI.bevelDark,
  borderRightColor: HOME_UI.bevelDark,
};

export function homeFeedCard(extra?: ViewStyle): ViewStyle {
  return {
    backgroundColor: HOME_UI.surface,
    borderRadius: HOME_UI.cardRadiusLg,
    borderWidth: 0,
    overflow: 'hidden',
    ...platformShadow({
      color: HOME_UI.shadow,
      offsetY: 8,
      opacity: 0.06,
      radius: 24,
      elevation: 3,
    }),
    ...extra,
  };
}

export function homeSectionPanel(tone: 'default' | 'gold' = 'default', extra?: ViewStyle): ViewStyle {
  return {
    borderRadius: HOME_UI.cardRadiusLg,
    backgroundColor: tone === 'gold' ? HOME_UI.goldSoft : HOME_UI.surface,
    borderWidth: tone === 'gold' ? 1 : 0,
    borderColor: tone === 'gold' ? HOME_UI.goldBorder : 'transparent',
    padding: HOME_UI.sectionPanelPad,
    gap: 12,
    ...platformShadow({
      color: HOME_UI.shadow,
      offsetY: 8,
      opacity: 0.06,
      radius: 24,
      elevation: 2,
    }),
    ...extra,
  };
}

export const homePressFeedback = {
  opacity: 0.94,
  transform: [{ scale: 0.985 }] as const,
};
