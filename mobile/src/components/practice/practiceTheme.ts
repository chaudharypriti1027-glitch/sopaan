/** Tokens from practice-ui.html mockup. */
export const PRACTICE_UI = {
  bg: '#F0F2FA',
  headerStart: '#3B2FA0',
  headerMid: '#5B4FCF',
  headerEnd: '#7C6FE0',
  eyebrow: '#C4B5FD',
  gold: '#FCD34D',
  goldBadge: '#F59E0B',
  tabBg: '#E0E4F5',
  tabActive: '#4338CA',
  tabMuted: '#64748B',
  sectionLabel: '#94A3B8',
  sectionCount: '#6366F1',
  ink: '#1E293B',
  meta: '#94A3B8',
  muted: '#64748B',
  card: '#FFFFFF',
  startStart: '#818CF8',
  startEnd: '#6366F1',
  chipPurpleBg: 'rgba(99,102,241,0.25)',
  chipPurpleBorder: 'rgba(99,102,241,0.5)',
  chipPurpleText: '#C7D2FE',
  chipAmberBg: 'rgba(245,158,11,0.2)',
  chipAmberBorder: 'rgba(245,158,11,0.45)',
  chipAmberText: '#FDE68A',
  chipGreenBg: 'rgba(16,185,129,0.2)',
  chipGreenBorder: 'rgba(16,185,129,0.4)',
  chipGreenText: '#6EE7B7',
  chipWhiteBg: 'rgba(255,255,255,0.12)',
  chipWhiteBorder: 'rgba(255,255,255,0.25)',
  chipWhiteText: '#E2E8F0',
  statIndigoBg: '#EEF2FF',
  statIndigo: '#6366F1',
  statGreenBg: '#ECFDF5',
  statGreen: '#059669',
  statAmberBg: '#FFFBEB',
  statAmber: '#D97706',
} as const;

export type PracticeAvatarTone = 'purple' | 'green' | 'amber' | 'pink';

export const AVATAR_GRADIENTS: Record<PracticeAvatarTone, [string, string]> = {
  purple: ['#818CF8', '#6366F1'],
  green: ['#34D399', '#059669'],
  amber: ['#FBBF24', '#D97706'],
  pink: ['#F9A8D4', '#EC4899'],
};

export function avatarToneForIndex(index: number): PracticeAvatarTone {
  const tones: PracticeAvatarTone[] = ['purple', 'green', 'amber', 'pink'];
  return tones[index % tones.length];
}
