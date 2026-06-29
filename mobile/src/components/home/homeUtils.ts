import { Dimensions } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardList,
  Clock,
  Flame,
  Gamepad2,
  Layers,
  Newspaper,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react-native';
import type { ContinueItem } from '../../types/home';

const ICONS: Record<string, LucideIcon> = {
  'clipboard-list': ClipboardList,
  sparkles: Sparkles,
  newspaper: Newspaper,
  'gamepad-2': Gamepad2,
  clock: Clock,
  book: BookOpen,
  'book-open': BookOpen,
  flame: Flame,
  target: Target,
  calendar: Calendar,
  layers: Layers,
  trophy: Trophy,
  zap: Zap,
  'trending-up': TrendingUp,
};

export function resolveHomeIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles;
}

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
