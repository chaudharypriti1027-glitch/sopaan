import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Gamepad2,
  GraduationCap,
  Layers,
  MessageCircle,
  Newspaper,
  PenLine,
  Radio,
  Search,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Users,
  Video,
  Zap,
} from 'lucide-react-native';
import type { TierFeatureKey } from '../api/tier';
import type { AppTabParamList, MainStackParamList } from './types';
import type { FeatureLinkTone, ProfileFeatureSection } from './profileFeatureLinks';

export type HomeFeatureRoute = keyof MainStackParamList | keyof AppTabParamList;

export type HomeFeatureSectionKey = ProfileFeatureSection['titleKey'];

export type HomeFeatureLink = {
  route: HomeFeatureRoute;
  icon: ProfileFeatureSection['links'][number]['icon'];
  tone: FeatureLinkTone;
  labelKey: ProfileFeatureSection['links'][number]['labelKey'];
  navigateVia: 'stack' | 'tab';
  /** Shows Pro crown when user is on free tier. */
  proHighlight?: boolean;
  /** Opens paywall with this feature when free user taps. */
  tierFeature?: TierFeatureKey;
};

export type HomeFeatureSection = {
  titleKey: HomeFeatureSectionKey;
  links: HomeFeatureLink[];
};

function stack(
  route: keyof MainStackParamList,
  icon: HomeFeatureLink['icon'],
  tone: FeatureLinkTone,
  labelKey: HomeFeatureLink['labelKey'],
  extras: Pick<HomeFeatureLink, 'proHighlight' | 'tierFeature'> = {},
): HomeFeatureLink {
  return { route, icon, tone, labelKey, navigateVia: 'stack', ...extras };
}

function tab(
  route: keyof AppTabParamList,
  icon: HomeFeatureLink['icon'],
  tone: FeatureLinkTone,
  labelKey: HomeFeatureLink['labelKey'],
): HomeFeatureLink {
  return { route, icon, tone, labelKey, navigateVia: 'tab' };
}

/** Canonical home explore grid — icons, tones, and Pro highlights in one place. */
export const HOME_FEATURE_SECTIONS: HomeFeatureSection[] = [
  {
    titleKey: 'learning',
    links: [
      tab('Practice', ClipboardList, 'primary', 'practice'),
      stack('Courses', GraduationCap, 'primary', 'courses'),
      stack('Books', BookOpen, 'teal', 'books'),
      stack('Flashcards', Layers, 'gold', 'flashcards'),
      stack('Vocabulary', BookOpen, 'coral', 'vocabulary'),
      stack('RevisionCapsules', FileText, 'primary', 'revisionCapsules'),
      stack('TestSeries', ClipboardList, 'teal', 'testSeries'),
    ],
  },
  {
    titleKey: 'prep',
    links: [
      stack('ExamCalendar', Calendar, 'gold', 'examCalendar'),
      stack('Readiness', Target, 'primary', 'readiness'),
      stack('Roadmap', Zap, 'teal', 'roadmap'),
      stack('StudyPlanner', PenLine, 'coral', 'studyPlanner'),
      stack('PhysicalTest', Trophy, 'gold', 'physicalTest'),
      stack('FocusTimer', Timer, 'primary', 'focusTimer'),
      stack('Wellness', Sparkles, 'teal', 'wellness'),
    ],
  },
  {
    titleKey: 'community',
    links: [
      stack('Forum', MessageCircle, 'primary', 'forum'),
      stack('Mentors', Users, 'gold', 'mentors'),
      stack('LiveClasses', Video, 'coral', 'liveClasses', { proHighlight: true }),
      stack('CommunityTests', Radio, 'teal', 'communityTests'),
      stack('Leaderboard', Award, 'primary', 'leaderboard'),
      stack('SuccessStories', Newspaper, 'gold', 'successStories'),
    ],
  },
  {
    titleKey: 'tools',
    links: [
      stack('AskAI', Sparkles, 'gold', 'askAi', { proHighlight: true, tierFeature: 'ai_doubt' }),
      stack('Search', Search, 'primary', 'search'),
      stack('AnswerEvaluation', PenLine, 'teal', 'answerEvaluation', {
        proHighlight: true,
        tierFeature: 'ai_evaluate',
      }),
      stack('ProgressAnalytics', BarChart3, 'coral', 'progressAnalytics', {
        proHighlight: true,
        tierFeature: 'detailed_analytics',
      }),
      stack('MockAnalysis', BarChart3, 'primary', 'mockAnalysis', {
        proHighlight: true,
        tierFeature: 'detailed_analytics',
      }),
      stack('Notes', FileText, 'teal', 'notes'),
      stack('Games', Gamepad2, 'coral', 'games'),
      tab('CurrentAffairs', Newspaper, 'teal', 'currentAffairs'),
    ],
  },
];

export const HOME_FEATURE_SECTION_KEYS = HOME_FEATURE_SECTIONS.map((section) => section.titleKey);

export const HOME_FEATURE_TONE_COLORS: Record<
  FeatureLinkTone,
  { bg: string; fg: string }
> = {
  primary: { bg: '#EEF2FF', fg: '#4F46E5' },
  gold: { bg: '#FFFBEB', fg: '#D97706' },
  teal: { bg: '#ECFDF5', fg: '#059669' },
  coral: { bg: '#FFF1F2', fg: '#E11D48' },
};
