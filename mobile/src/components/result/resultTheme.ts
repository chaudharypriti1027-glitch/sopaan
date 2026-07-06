/** Premium result screen tokens — matches sopaan-result-premium.html */
import type { ViewStyle } from 'react-native';
import { platformShadow } from '../../utils/platformShadow';

export const RESULT_UI = {
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
  heroRadius: 34,
  cardRadius: 22,
  innerRadius: 14,
  horizontalPad: 16,
  bodyLift: -46,
} as const;

export function resultCard(extra?: ViewStyle): ViewStyle {
  return {
    backgroundColor: RESULT_UI.surface,
    borderRadius: RESULT_UI.cardRadius,
    borderWidth: 1,
    borderColor: RESULT_UI.line,
    overflow: 'hidden',
    ...platformShadow({
      color: RESULT_UI.navy,
      offsetY: 16,
      opacity: 0.11,
      radius: 26,
      elevation: 4,
    }),
    ...extra,
  };
}

export function topicBarVariant(pct: number): 'sage' | 'gold' | 'navy' {
  if (pct >= 70) return 'sage';
  if (pct >= 50) return 'gold';
  return 'navy';
}

export function topicPctColor(pct: number): string {
  if (pct >= 70) return RESULT_UI.sageDeep;
  if (pct >= 50) return RESULT_UI.goldDeep;
  return RESULT_UI.red;
}

export const TOPIC_BAR_GRADIENT = {
  sage: ['#6C9A8A', '#4C7264'] as const,
  gold: ['#D8B368', '#C29A4E'] as const,
  navy: ['#3A4680', '#232A4D'] as const,
};
