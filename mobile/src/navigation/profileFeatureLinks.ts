import type { LucideIcon } from 'lucide-react-native';
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  GraduationCap,
  Layers,
  Library,
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
import type { MainStackParamList } from './types';

export type FeatureLinkTone = 'primary' | 'gold' | 'teal' | 'coral';

export type ProfileFeatureLink = {
  route: keyof MainStackParamList;
  icon: LucideIcon;
  tone: FeatureLinkTone;
  labelKey: keyof typeof import('../i18n/locales/en/navigation.json');
};

export type ProfileFeatureSection = {
  titleKey: 'learning' | 'prep' | 'community' | 'tools';
  links: ProfileFeatureLink[];
};

export const PROFILE_FEATURE_SECTIONS: ProfileFeatureSection[] = [
  {
    titleKey: 'learning',
    links: [
      { route: 'Courses', icon: GraduationCap, tone: 'primary', labelKey: 'courses' },
      { route: 'Books', icon: Library, tone: 'teal', labelKey: 'books' },
      { route: 'Flashcards', icon: Layers, tone: 'gold', labelKey: 'flashcards' },
      { route: 'Vocabulary', icon: BookOpen, tone: 'coral', labelKey: 'vocabulary' },
      { route: 'RevisionCapsules', icon: FileText, tone: 'primary', labelKey: 'revisionCapsules' },
      { route: 'TestSeries', icon: ClipboardList, tone: 'teal', labelKey: 'testSeries' },
    ],
  },
  {
    titleKey: 'prep',
    links: [
      { route: 'ExamCalendar', icon: Calendar, tone: 'gold', labelKey: 'examCalendar' },
      { route: 'Readiness', icon: Target, tone: 'primary', labelKey: 'readiness' },
      { route: 'Roadmap', icon: Zap, tone: 'teal', labelKey: 'roadmap' },
      { route: 'StudyPlanner', icon: PenLine, tone: 'coral', labelKey: 'studyPlanner' },
      { route: 'PhysicalTest', icon: Trophy, tone: 'gold', labelKey: 'physicalTest' },
      { route: 'FocusTimer', icon: Timer, tone: 'primary', labelKey: 'focusTimer' },
      { route: 'Wellness', icon: Sparkles, tone: 'teal', labelKey: 'wellness' },
    ],
  },
  {
    titleKey: 'community',
    links: [
      { route: 'Forum', icon: MessageCircle, tone: 'primary', labelKey: 'forum' },
      { route: 'Mentors', icon: Users, tone: 'gold', labelKey: 'mentors' },
      { route: 'LiveClasses', icon: Video, tone: 'coral', labelKey: 'liveClasses' },
      { route: 'CommunityTests', icon: Radio, tone: 'teal', labelKey: 'communityTests' },
      { route: 'Leaderboard', icon: Award, tone: 'primary', labelKey: 'leaderboard' },
      { route: 'SuccessStories', icon: Newspaper, tone: 'gold', labelKey: 'successStories' },
    ],
  },
  {
    titleKey: 'tools',
    links: [
      { route: 'Search', icon: Search, tone: 'primary', labelKey: 'search' },
      { route: 'AskAI', icon: Sparkles, tone: 'gold', labelKey: 'askAi' },
      { route: 'AnswerEvaluation', icon: PenLine, tone: 'teal', labelKey: 'answerEvaluation' },
      { route: 'ProgressAnalytics', icon: BarChart3, tone: 'coral', labelKey: 'progressAnalytics' },
      { route: 'MockAnalysis', icon: BarChart3, tone: 'primary', labelKey: 'mockAnalysis' },
      { route: 'Notes', icon: FileText, tone: 'teal', labelKey: 'notes' },
    ],
  },
];
