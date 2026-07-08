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
  ClipboardList,
  Clock,
  Code2,
  Flame,
  FlaskConical,
  Gamepad2,
  Globe2,
  Landmark,
  Layers,
  LayoutGrid,
  Lightbulb,
  MessageCircle,
  Newspaper,
  Play,
  Radio,
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
  WifiOff,
  Zap,
} from 'lucide-react-native';
import type { PremiumIconSize, PremiumIconTone } from '../premium/premiumIconTokens';
import type { FeatureLinkTone } from '../../navigation/profileFeatureLinks';
import type { AINudge, ContinueItem, TestCard } from '../../types/home';
import type { HomeSectionKey } from './homeSectionConfig';

/** Default coach card when the feed has no AI nudges yet. */
export const HOME_COACH_FALLBACK: AINudge = {
  id: 'coach-fallback',
  tone: 'info',
  icon: 'sparkles',
  title: '',
  body: '',
  deeplink: '/stack/AskAI',
};

export const HOME_COACH_PROMPTS = [
  { key: 'coachPromptPlan', icon: 'target' as const, tone: 'gold' as const },
  { key: 'coachPromptWeak', icon: 'brain' as const, tone: 'lavender' as const },
  { key: 'coachPromptCa', icon: 'newspaper' as const, tone: 'coral' as const },
] as const;

/** Shared size / elevation presets — single source for all home icon slots. */
export const HOME_ICON_SLOTS = {
  section: { size: 'sm' as PremiumIconSize, elevated: true, filled: true },
  feed: { size: 'md' as PremiumIconSize, elevated: true, filled: true },
  grid: { size: 'sm' as PremiumIconSize, elevated: true, filled: true },
  hero: { size: 'sm' as PremiumIconSize, elevated: true, filled: true, surface: 'dark' as const },
  featured: { size: 'lg' as PremiumIconSize, elevated: true, filled: true },
  shortcut: { size: 'sm' as PremiumIconSize, elevated: true, filled: true },
  card: { size: 'sm' as PremiumIconSize, elevated: true, filled: true },
  micro: { size: 'xs' as PremiumIconSize, elevated: true, filled: true },
  button: { size: '2xs' as PremiumIconSize, elevated: true, filled: true },
  inline: { size: '2xs' as PremiumIconSize, elevated: false, filled: true },
  stat: { size: 'md' as PremiumIconSize, elevated: true, filled: true },
} as const;

export type HomeIconSlot = keyof typeof HOME_ICON_SLOTS;

export type HomeSectionIconSpec = {
  Icon: LucideIcon;
  tone: PremiumIconTone;
};

export const HOME_SECTION_ICONS: Record<HomeSectionKey, HomeSectionIconSpec> = {
  nudges: { Icon: Sparkles, tone: 'gold' },
  dailyChallenge: { Icon: Star, tone: 'gold' },
  continue: { Icon: Play, tone: 'lavender' },
  recommended: { Icon: ClipboardList, tone: 'mint' },
  affairs: { Icon: Newspaper, tone: 'sky' },
  league: { Icon: Trophy, tone: 'gold' },
  features: { Icon: LayoutGrid, tone: 'lavender' },
};

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
  radio: Radio,
  'wifi-off': WifiOff,
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

export function resolveTestSubjectIcon(tag?: string, title?: string): LucideIcon {
  const haystack = [tag, title].filter(Boolean).join(' ');
  if (haystack) {
    const match = SUBJECT_KEYWORD_ICONS.find(([pattern]) => pattern.test(haystack));
    if (match) return match[1];
  }
  return ClipboardList;
}

const AFFAIR_ICONS: LucideIcon[] = [Landmark, TrendingUp, Globe2, Scale, Newspaper];
const AFFAIR_ICON_TONES: PremiumIconTone[] = ['lavender', 'mint', 'sky', 'gold', 'rose'];

export function resolveAffairIcon(index: number): LucideIcon {
  return AFFAIR_ICONS[index % AFFAIR_ICONS.length];
}

export function affairIconTone(index: number): PremiumIconTone {
  return AFFAIR_ICON_TONES[index % AFFAIR_ICON_TONES.length];
}

export function continueItemIcon(kind: ContinueItem['kind']): LucideIcon {
  switch (kind) {
    case 'video':
      return Video;
    case 'test':
      return BookOpen;
    case 'lesson':
    default:
      return Play;
  }
}

const FEATURE_LINK_TONE_MAP: Record<FeatureLinkTone, PremiumIconTone> = {
  primary: 'lavender',
  gold: 'gold',
  teal: 'mint',
  coral: 'rose',
};

export function featureLinkPremiumTone(tone: FeatureLinkTone): PremiumIconTone {
  return FEATURE_LINK_TONE_MAP[tone];
}

export function nudgePremiumTone(tone: AINudge['tone']): PremiumIconTone {
  switch (tone) {
    case 'urgent':
      return 'rose';
    case 'streak':
      return 'gold';
    case 'opportunity':
      return 'mint';
    case 'info':
    default:
      return 'lavender';
  }
}

export function continueAccentTone(accent: ContinueItem['accent']): PremiumIconTone {
  switch (accent) {
    case 'teal':
      return 'mint';
    case 'gold':
      return 'gold';
    case 'coral':
      return 'rose';
    case 'primary':
    default:
      return 'lavender';
  }
}

export function testDifficultyIconTone(difficulty: TestCard['difficulty']): PremiumIconTone {
  switch (difficulty) {
    case 'easy':
      return 'mint';
    case 'hard':
      return 'lavender';
    default:
      return 'gold';
  }
}

/** Props spread helper — keeps icon sizing consistent per slot. */
export function homeIconProps(slot: HomeIconSlot) {
  return HOME_ICON_SLOTS[slot];
}
