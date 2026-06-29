import type { LucideIcon } from 'lucide-react-native';
import type { MainStackParamList } from '../../navigation/types';

export type ProfileMenuTone = 'indigo' | 'gold' | 'teal' | 'coral';

export type ProfileSummaryCountKey =
  | 'courses'
  | 'savedQuestions'
  | 'mistakes'
  | 'achievements'
  | 'coins'
  | 'downloads';

export type ProfileMenuLabelKey =
  | 'performance'
  | 'courses'
  | 'saved'
  | 'mistakes'
  | 'downloads'
  | 'badges'
  | 'wallet'
  | 'refer'
  | 'subscription'
  | 'edit'
  | 'notifications'
  | 'language'
  | 'privacy'
  | 'help'
  | 'whatsappCommunity'
  | 'rate';

export type ProfileMenuSectionKey = 'learning' | 'rewards' | 'settings';

export type ProfileMenuItem = {
  id: string;
  labelKey: ProfileMenuLabelKey;
  route?: keyof MainStackParamList;
  tone: ProfileMenuTone;
  icon: LucideIcon;
  metaKey?: 'languageEnglish' | 'languageHindi' | 'languageGu';
  countKey?: ProfileSummaryCountKey;
  badge?: string;
  testID?: string;
  action?: 'edit' | 'help' | 'whatsapp' | 'logout';
};

export type ProfileMenuSection = {
  id: string;
  titleKey: ProfileMenuSectionKey;
  items: ProfileMenuItem[];
};
