/** Premium practice tab tokens — brand navy · cream · gold. */
export const PRACTICE_UI = {
  bg: '#F3EEE1',
  headerStart: '#2C3568',
  headerMid: '#1C2450',
  headerEnd: '#131A3C',
  eyebrow: '#C9CDE3',
  gold: '#E9CF8D',
  goldBadge: '#C9A24B',
  goldDeep: '#A67F2E',
  goldSoft: 'rgba(201,162,75,0.14)',
  goldBorder: 'rgba(201,162,75,0.35)',
  tabBg: '#EAE6D9',
  tabActive: '#1C2450',
  tabMuted: '#5C5E6E',
  sectionLabel: '#8B8FA3',
  sectionCount: '#1C2450',
  ink: '#1D2440',
  meta: '#5C5E6E',
  muted: '#6B6D7E',
  card: '#FFFFFF',
  startStart: '#2C3568',
  startEnd: '#1A1F3B',
  goldCtaStart: '#E9CF8D',
  goldCtaEnd: '#C29A4E',
  goldCtaText: '#251C08',
  navy: '#1C2450',
  chipPurpleBg: 'rgba(35,42,77,0.14)',
  chipPurpleBorder: 'rgba(35,42,77,0.32)',
  chipPurpleText: '#ECEEF8',
  chipAmberBg: 'rgba(201,162,75,0.22)',
  chipAmberBorder: 'rgba(201,162,75,0.45)',
  chipAmberText: '#FFF4E0',
  chipGreenBg: 'rgba(95,138,123,0.22)',
  chipGreenBorder: 'rgba(95,138,123,0.45)',
  chipGreenText: '#EAF6F1',
  chipWhiteBg: 'rgba(255,255,255,0.18)',
  chipWhiteBorder: 'rgba(255,255,255,0.35)',
  chipWhiteText: '#FFFFFF',
  statIndigoBg: '#EAEDF6',
  statIndigo: '#1C2450',
  statGreenBg: '#E4EDE9',
  statGreen: '#4C7264',
  statAmberBg: '#F6EDDA',
  statAmber: '#A67F2E',
} as const;

export type PracticeAvatarTone = 'purple' | 'green' | 'amber' | 'pink';

export const AVATAR_GRADIENTS: Record<PracticeAvatarTone, [string, string]> = {
  purple: ['#3B4373', '#1C2450'],
  green: ['#8BAEA0', '#5F8A7B'],
  amber: ['#E9CF8D', '#C29A4E'],
  pink: ['#D4A08C', '#C4634F'],
};

export function avatarToneForIndex(index: number): PracticeAvatarTone {
  const tones: PracticeAvatarTone[] = ['purple', 'green', 'amber', 'pink'];
  return tones[index % tones.length];
}
