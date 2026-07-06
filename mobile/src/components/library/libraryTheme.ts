/** Premium library tokens — matches sopaan-library-premium-v2.html */
import type { ViewStyle } from 'react-native';
import { platformShadow } from '../../utils/platformShadow';

export const LIBRARY_UI = {
  bg: '#F4F1E9',
  surface: '#FFFFFF',
  ink: '#1C1E2E',
  ink2: '#41435A',
  muted: '#87889A',
  faint: '#B3B4C2',
  line: '#ECE8DD',
  hair: '#F3F0E8',
  navy: '#232A4D',
  navy2: '#2E3766',
  navyDeep: '#1A1F3B',
  navySoft: '#E9EBF3',
  gold: '#C29A4E',
  goldLt: '#E3C97F',
  goldDeep: '#A67C33',
  goldSoft: '#F4EBD8',
  goldBorder: '#EADFC4',
  sage: '#5F8A7B',
  sageDeep: '#4C7264',
  sageSoft: '#E4EDE9',
  red: '#C0503F',
  redSoft: '#FBE9E7',
  heroGradient: ['#2E3766', '#232A4D', '#1A1F3B'] as const,
  heroRadius: 30,
  cardRadius: 20,
  cardRadiusLg: 22,
  horizontalPad: 16,
} as const;

export type CoverVariant = 'navy' | 'gold' | 'sage' | 'deep' | 'rust';

export const COVER_GRADIENT: Record<CoverVariant, readonly [string, string]> = {
  navy: ['#3A4680', '#232A4D'],
  gold: ['#C29A4E', '#8A6323'],
  sage: ['#6C9A8A', '#3F5F53'],
  deep: ['#2E3766', '#12162B'],
  rust: ['#C0503F', '#7E3122'],
};

export type SubjectTone = 'navy' | 'gold' | 'sage' | 'rust';

export const SUBJECT_TONE: Record<
  SubjectTone,
  { bg: string; fg: string }
> = {
  navy: { bg: LIBRARY_UI.navySoft, fg: LIBRARY_UI.navy },
  gold: { bg: LIBRARY_UI.goldSoft, fg: LIBRARY_UI.goldDeep },
  sage: { bg: LIBRARY_UI.sageSoft, fg: LIBRARY_UI.sageDeep },
  rust: { bg: LIBRARY_UI.redSoft, fg: LIBRARY_UI.red },
};

export function libraryCard(extra?: ViewStyle): ViewStyle {
  return {
    backgroundColor: LIBRARY_UI.surface,
    borderRadius: LIBRARY_UI.cardRadiusLg,
    borderWidth: 1,
    borderColor: LIBRARY_UI.line,
    ...platformShadow({
      color: LIBRARY_UI.navy,
      offsetY: 16,
      opacity: 0.11,
      radius: 26,
      elevation: 4,
    }),
    ...extra,
  };
}
