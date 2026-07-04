/** "Classic Premium" home tokens — navy/gold/sage reference UI. */
import { FLOATING_TAB_BAR_BOTTOM_PADDING } from '../../navigation/tabBarConstants';

export const HOME_UI = {
  bg: '#F4F1E9',
  surface: '#FFFFFF',
  ink: '#1C1E2E',
  muted: '#87889A',
  border: '#ECE8DD',
  borderSoft: '#E9EBF3',
  accent: '#232A4D',
  accentSoft: '#E9EBF3',
  accentGradient: ['#2E3766', '#232A4D'] as const,
  gold: '#C29A4E',
  goldDeep: '#A67C33',
  goldSoft: '#F4EBD8',
  sage: '#5F8A7B',
  sageDeep: '#4C7264',
  sageSoft: '#E4EDE9',
  shadow: '#232A4D',
  tileBg: '#FAFAF7',
  heroGradient: ['#2E3766', '#232A4D', '#1A1F3B'] as const,
  leagueGradient: ['#2E3766', '#1A1F3B'] as const,
  forYouLift: -22,
  /** Vertical gap between home feed sections (below hero overlap). */
  sectionGap: 22,
  /** Scroll padding above floating glass tab bar. */
  tabBottomPad: FLOATING_TAB_BAR_BOTTOM_PADDING + 24,
} as const;
