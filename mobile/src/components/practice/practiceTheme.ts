/** Premium practice tab tokens — navy/gold. */
export const PRACTICE_UI = {
  bg: '#F4F1E9',
  headerStart: '#2E3766',
  headerMid: '#232A4D',
  headerEnd: '#1A1F3B',
  eyebrow: '#C0C4DB',
  gold: '#E3C97F',
  goldBadge: '#C29A4E',
  tabBg: '#E9EBF3',
  tabActive: '#232A4D',
  tabMuted: '#5C5E6E',
  sectionLabel: '#5C5E6E',
  sectionCount: '#232A4D',
  ink: '#1C1E2E',
  meta: '#5C5E6E',
  muted: '#6B6D7E',
  card: '#FFFFFF',
  startStart: '#2E3766',
  startEnd: '#1A1F3B',
  chipPurpleBg: 'rgba(35,42,77,0.14)',
  chipPurpleBorder: 'rgba(35,42,77,0.32)',
  chipPurpleText: '#ECEEF8',
  chipAmberBg: 'rgba(194,154,78,0.22)',
  chipAmberBorder: 'rgba(194,154,78,0.45)',
  chipAmberText: '#FFF4E0',
  chipGreenBg: 'rgba(95,138,123,0.22)',
  chipGreenBorder: 'rgba(95,138,123,0.45)',
  chipGreenText: '#EAF6F1',
  chipWhiteBg: 'rgba(255,255,255,0.18)',
  chipWhiteBorder: 'rgba(255,255,255,0.35)',
  chipWhiteText: '#FFFFFF',
  statIndigoBg: '#E9EBF3',
  statIndigo: '#232A4D',
  statGreenBg: '#E4EDE9',
  statGreen: '#4C7264',
  statAmberBg: '#F4EBD8',
  statAmber: '#A67C33',
} as const;

export type PracticeAvatarTone = 'purple' | 'green' | 'amber' | 'pink';

export const AVATAR_GRADIENTS: Record<PracticeAvatarTone, [string, string]> = {
  purple: ['#454C79', '#232A4D'],
  green: ['#8BAEA0', '#5F8A7B'],
  amber: ['#E3C97F', '#C29A4E'],
  pink: ['#D4A08C', '#C4634F'],
};

export function avatarToneForIndex(index: number): PracticeAvatarTone {
  const tones: PracticeAvatarTone[] = ['purple', 'green', 'amber', 'pink'];
  return tones[index % tones.length];
}
