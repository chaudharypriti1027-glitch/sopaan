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
  tabMuted: '#87889A',
  sectionLabel: '#B3B4C2',
  sectionCount: '#232A4D',
  ink: '#1C1E2E',
  meta: '#87889A',
  muted: '#87889A',
  card: '#FFFFFF',
  startStart: '#2E3766',
  startEnd: '#1A1F3B',
  chipPurpleBg: 'rgba(35,42,77,0.14)',
  chipPurpleBorder: 'rgba(35,42,77,0.32)',
  chipPurpleText: '#DBDEEA',
  chipAmberBg: 'rgba(194,154,78,0.18)',
  chipAmberBorder: 'rgba(194,154,78,0.35)',
  chipAmberText: '#F4EBD8',
  chipGreenBg: 'rgba(95,138,123,0.18)',
  chipGreenBorder: 'rgba(95,138,123,0.35)',
  chipGreenText: '#E4EDE9',
  chipWhiteBg: 'rgba(255,255,255,0.14)',
  chipWhiteBorder: 'rgba(255,255,255,0.28)',
  chipWhiteText: '#F3F0E8',
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
