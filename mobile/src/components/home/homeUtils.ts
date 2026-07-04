import { Dimensions } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  AlertTriangle,
  Award,
  Bell,
  BookOpen,
  Brain,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Code2,
  Flame,
  FlaskConical,
  Gamepad2,
  Globe2,
  Landmark,
  Lightbulb,
  Layers,
  MessageCircle,
  Newspaper,
  Rocket,
  Scale,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Video,
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
  'calendar-check': Calendar,
  layers: Layers,
  trophy: Trophy,
  award: Award,
  zap: Zap,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  brain: Brain,
  star: Star,
  check: CheckCircle2,
  'check-circle': CheckCircle2,
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertTriangle,
  bell: Bell,
  rocket: Rocket,
  lightbulb: Lightbulb,
  users: Users,
  video: Video,
  'message-circle': MessageCircle,
};

export function resolveHomeIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles;
}

const SUBJECT_KEYWORD_ICONS: [RegExp, LucideIcon][] = [
  [/python|coding|program|java|computer/i, Code2],
  [/math|arithmetic|quant|number/i, Calculator],
  [/reason(ing)?|logic|puzzle/i, Brain],
  [/history|heritage|culture/i, Landmark],
  [/geograph/i, Globe2],
  [/polity|constitution|civics|law/i, Scale],
  [/econom|finance|budget/i, TrendingUp],
  [/science|physics|chemistry|biology/i, FlaskConical],
  [/english|grammar|vocabulary|language/i, BookOpen],
  [/current affairs|news|gk|general knowledge/i, Newspaper],
];

/** Best-effort subject → icon match for free-form test tags/titles (falls back to a generic icon). */
export function resolveTestSubjectIcon(tag?: string, title?: string): LucideIcon {
  const haystack = [tag, title].filter(Boolean).join(' ');
  if (haystack) {
    const match = SUBJECT_KEYWORD_ICONS.find(([pattern]) => pattern.test(haystack));
    if (match) {
      return match[1];
    }
  }
  return ClipboardList;
}

const AFFAIR_ICONS: LucideIcon[] = [Landmark, TrendingUp, Globe2, Scale, Newspaper];

/** Cycles a small set of premium vector icons for affair thumbnails (no per-item category yet). */
export function resolveAffairIcon(index: number): LucideIcon {
  return AFFAIR_ICONS[index % AFFAIR_ICONS.length];
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
