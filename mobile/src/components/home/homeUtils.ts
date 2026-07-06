import { Dimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { ContinueItem } from '../../types/home';

/** @deprecated Import icon resolvers from `./homeIcons` instead. */
export {
  affairIconTone,
  resolveAffairIcon,
  resolveHomeIcon,
  resolveTestSubjectIcon,
} from './homeIcons';

export function resolveContinueAccent(
  accent: ContinueItem['accent'],
  colors: {
    brand: { primary: string };
    accent: { teal: string; goldOn: string; coral: string };
  },
) {
  switch (accent) {
    case 'teal':
      return colors.accent.teal;
    case 'gold':
      return colors.accent.goldOn;
    case 'coral':
      return colors.accent.coral;
    default:
      return colors.brand.primary;
  }
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export const CONTINUE_CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.76);

export { ChevronRight };
