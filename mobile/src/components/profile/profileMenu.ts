import {
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Download,
  Edit3,
  HelpCircle,
  Languages,
  Shield,
  Target,
  Trophy,
  UserPlus,
  Wallet,
} from 'lucide-react-native';
import type { Profile } from '../../types/auth';
import type { ProfileMenuItem, ProfileMenuSection } from './profileMenuTypes';

type ProfileMenuLabelKey = ProfileMenuItem['labelKey'];
type ProfileMenuSectionKey = ProfileMenuSection['titleKey'];

function languageMeta(profile: Profile): ProfileMenuItem['metaKey'] {
  if (profile.language === 'hi') {
    return 'languageHindi';
  }
  if (profile.language === 'gu') {
    return 'languageGu';
  }
  return 'languageEnglish';
}

/** Menu structure aligned with sopaan-profile-premium-plus.html */
export function buildProfileMenuSections(profile: Profile): ProfileMenuSection[] {
  const sections: ProfileMenuSection[] = [
    {
      id: 'learning',
      titleKey: 'learning',
      items: [
        { id: 'performance', labelKey: 'performance', route: 'ProgressAnalytics', tone: 'indigo', icon: BarChart3 },
        { id: 'courses', labelKey: 'courses', route: 'Courses', tone: 'teal', icon: BookOpen, countKey: 'courses' },
        { id: 'saved', labelKey: 'saved', route: 'Notes', tone: 'gold', icon: Bookmark, countKey: 'savedQuestions' },
        { id: 'mistakes', labelKey: 'mistakes', route: 'MockAnalysis', tone: 'indigo', icon: Target, countKey: 'mistakes' },
        { id: 'downloads', labelKey: 'downloads', route: 'Notes', tone: 'teal', icon: Download, countKey: 'downloads' },
      ],
    },
    {
      id: 'rewards',
      titleKey: 'rewards',
      items: [
        { id: 'badges', labelKey: 'badges', route: 'Rewards', tone: 'gold', icon: Trophy, countKey: 'achievements' },
        { id: 'wallet', labelKey: 'wallet', route: 'Rewards', tone: 'teal', icon: Wallet, countKey: 'coins' },
        { id: 'refer', labelKey: 'refer', route: 'ReferEarn', tone: 'gold', icon: UserPlus, badge: '₹100' },
      ],
    },
    {
      id: 'settings',
      titleKey: 'settings',
      items: [
        {
          id: 'edit',
          labelKey: 'edit',
          tone: 'indigo',
          icon: Edit3,
          action: 'edit',
          testID: 'profile-edit',
        },
        {
          id: 'notifications',
          labelKey: 'notifications',
          route: 'Notifications',
          tone: 'gold',
          icon: Bell,
        },
        {
          id: 'language',
          labelKey: 'language',
          route: 'Settings',
          tone: 'teal',
          icon: Languages,
          metaKey: languageMeta(profile),
        },
        {
          id: 'privacy',
          labelKey: 'privacy',
          route: 'PrivacyPolicy',
          tone: 'indigo',
          icon: Shield,
        },
        {
          id: 'help',
          labelKey: 'help',
          tone: 'gold',
          icon: HelpCircle,
          action: 'help',
          testID: 'profile-help',
        },
      ],
    },
  ];

  return sections;
}

export function formatProfileSummaryCount(value: number | undefined) {
  return String(value ?? 0);
}

export type { ProfileMenuLabelKey, ProfileMenuSectionKey };
