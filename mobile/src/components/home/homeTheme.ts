/** "Classic Premium" home tokens — navy/gold/sage reference UI. */
import type { ViewStyle } from 'react-native';
import { FLOATING_TAB_BAR_BOTTOM_PADDING } from '../../navigation/tabBarConstants';
import { platformShadow } from '../../utils/platformShadow';

export const HOME_UI = {
  bg: '#F6F3EB',
  bgTop: '#F9F6EF',
  bgBottom: '#F0EBE2',
  surface: '#FFFFFF',
  ink: '#1C1E2E',
  muted: '#87889A',
  border: '#ECE8DD',
  borderSoft: '#E9EBF3',
  accent: '#232A4D',
  accentSoft: '#E9EBF3',
  accentGradient: ['#2E3766', '#232A4D'] as const,
  gold: '#C29A4E',
  goldLt: '#E3C97F',
  goldDeep: '#A67C33',
  goldSoft: '#F4EBD8',
  goldBorder: '#EADFC4',
  sage: '#5F8A7B',
  sageDeep: '#4C7264',
  sageSoft: '#E4EDE9',
  shadow: '#232A4D',
  tileBg: '#FAFAF7',
  heroGradient: ['#343D6E', '#2A325C', '#1F2648', '#171C38'] as const,
  leagueGradient: ['#2E3766', '#1A1F3B'] as const,
  heroRadius: 28,
  cardRadius: 20,
  cardRadiusLg: 22,
  innerRadius: 14,
  horizontalPad: 16,
  feedTopPad: 20,
  feedHeroOverlap: 22,
  sectionGap: 16,
  sectionPanelPad: 14,
  tabBottomPad: FLOATING_TAB_BAR_BOTTOM_PADDING + 28,
  bevelDark: '#D8D2C6',
  bevelLight: '#F8F6F0',
} as const;

/** 3D bevel border — light bottom/right edge for raised surfaces. */
export const home3dBevel: ViewStyle = {
  borderBottomWidth: 1,
  borderRightWidth: 1,
  borderBottomColor: HOME_UI.bevelDark,
  borderRightColor: HOME_UI.bevelDark,
};

/** Shared elevated white card shell for feed rows and lists. */
export function homeFeedCard(extra?: ViewStyle): ViewStyle {
  return {
    backgroundColor: HOME_UI.surface,
    borderRadius: HOME_UI.cardRadiusLg,
    borderWidth: 1,
    borderColor: HOME_UI.border,
    overflow: 'hidden',
    ...platformShadow({
      color: HOME_UI.shadow,
      offsetY: 6,
      opacity: 0.07,
      radius: 14,
      elevation: 3,
    }),
    ...extra,
  };
}

/** Section body panel — groups content under each header. */
export function homeSectionPanel(tone: 'default' | 'gold' = 'default', extra?: ViewStyle): ViewStyle {
  return {
    borderRadius: HOME_UI.cardRadiusLg,
    backgroundColor: tone === 'gold' ? HOME_UI.goldSoft : HOME_UI.surface,
    borderWidth: 1,
    borderColor: tone === 'gold' ? HOME_UI.goldBorder : HOME_UI.border,
    ...home3dBevel,
    padding: HOME_UI.sectionPanelPad,
    gap: 12,
    ...platformShadow({
      color: tone === 'gold' ? HOME_UI.goldDeep : HOME_UI.shadow,
      offsetY: 8,
      opacity: tone === 'gold' ? 0.08 : 0.1,
      radius: 18,
      elevation: 3,
    }),
    ...extra,
  };
}

/** Consistent press feedback for home tappable surfaces. */
export const homePressFeedback = {
  opacity: 0.94,
  transform: [{ scale: 0.985 }] as const,
};
