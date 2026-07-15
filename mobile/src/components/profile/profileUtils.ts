import type { LucideIcon } from 'lucide-react-native';
import {
  Award,
  Flame,
  Medal,
  Target,
  Trophy,
  Zap,
} from 'lucide-react-native';

export const XP_PER_LEVEL = 500;

export const LEVEL_TITLE_KEYS = [
  'starter',
  'learner',
  'scholar',
  'expert',
  'master',
  'legend',
] as const;

export function getLevelTitleKey(level: number): (typeof LEVEL_TITLE_KEYS)[number] {
  const index = Math.min(Math.max(level - 1, 0), LEVEL_TITLE_KEYS.length - 1);
  return LEVEL_TITLE_KEYS[index];
}

/** @deprecated Prefer getLevelTitleKey + i18n `profile.levelTitle.*`. */
export function getLevelTitle(level: number): string {
  const titles = ['Starter', 'Learner', 'Scholar', 'Expert', 'Master', 'Legend'] as const;
  const index = Math.min(Math.max(level - 1, 0), titles.length - 1);
  return titles[index];
}

export function getXpProgress(xp: number, level: number) {
  const safeLevel = Math.max(level, 1);
  const xpInLevel = Math.max(0, xp - (safeLevel - 1) * XP_PER_LEVEL);
  const current = Math.min(xpInLevel, XP_PER_LEVEL);
  const pct = XP_PER_LEVEL > 0 ? current / XP_PER_LEVEL : 0;

  return { current, max: XP_PER_LEVEL, pct };
}

export type AchievementTone = 'gold' | 'sage' | 'navy' | 'lock';

export type AchievementSlot = {
  key: string;
  labelKey: string;
  tone: AchievementTone;
  icon: LucideIcon;
};

export const PROFILE_ACHIEVEMENT_SLOTS: AchievementSlot[] = [
  { key: 'first_attempt', labelKey: 'firstTest', tone: 'gold', icon: Trophy },
  { key: 'streak_7', labelKey: 'streak7', tone: 'sage', icon: Flame },
  { key: 'top_100', labelKey: 'top100', tone: 'navy', icon: Medal },
  { key: 'perfect_score', labelKey: 'sharp', tone: 'gold', icon: Target },
  { key: 'streak_3', labelKey: 'streak3', tone: 'sage', icon: Zap },
  { key: 'focus_master', labelKey: 'focus', tone: 'navy', icon: Award },
];

const BADGE_LABEL_OVERRIDES: Record<string, string> = {
  first_attempt: 'firstTest',
  perfect_score: 'sharp',
  streak_3: 'streak3',
  streak_7: 'streak7',
};

export function resolveAchievementLabelKey(key: string): string {
  return BADGE_LABEL_OVERRIDES[key] ?? key.replace(/_/g, ' ');
}

export function maskPhoneForProfile(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);

  if (digits.length < 4) {
    return '+91 •••• ••••';
  }

  return `+91 •••• ••${digits.slice(-4)}`;
}
