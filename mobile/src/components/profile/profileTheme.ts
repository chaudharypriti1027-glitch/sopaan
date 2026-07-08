import type { ViewStyle } from 'react-native';
import type { Theme } from '../../theme/types';
import { platformShadow } from '../../utils/platformShadow';

/** Profile screen tokens — matches sopaan-profile-premium-plus.html */
export const PROFILE = {
  bg: '#F4F1E9',
  surface: '#FFFFFF',
  line: '#ECE8DD',
  hair: '#F3F0E8',
  ink: '#1C1E2E',
  ink2: '#41435A',
  muted: '#87889A',
  faint: '#B3B4C2',
  navy: '#232A4D',
  navy2: '#2E3766',
  navyDeep: '#1A1F3B',
  gold: '#C29A4E',
  goldLt: '#E3C97F',
  goldDeep: '#A67C33',
  goldSoft: '#F4EBD8',
  sage: '#5F8A7B',
  sageDeep: '#4C7264',
  cardRadius: 22,
  bodyLift: -44,
  stackGap: 12,
  sectionGap: 22,
  horizontalPad: 16,
  bgTop: '#EFEADE',
  bgMid: '#E4DFD0',
  tabBottomPad: 120,
} as const;

export function profileCard(_theme: Theme): ViewStyle {
  return {
    backgroundColor: PROFILE.surface,
    borderRadius: PROFILE.cardRadius,
    borderWidth: 1,
    borderColor: PROFILE.line,
    ...platformShadow({
      color: '#232A4D',
      offsetY: 6,
      opacity: 0.14,
      radius: 18,
      elevation: 4,
    }),
  };
}
