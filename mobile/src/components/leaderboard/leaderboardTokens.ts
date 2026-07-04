import type { LeaderboardPeriod } from '../../api/leaderboard';
import { FLOATING_TAB_BAR_BOTTOM_PADDING } from '../../navigation/tabBarConstants';

export type { LeaderboardPeriod };

/** Classic Premium leaderboard tokens — matches sopaan-leaderboard-premium.html */
export const LEADERBOARD_UI = {
  bg: '#F4F1E9',
  surface: '#FFFFFF',
  ink: '#1C1E2E',
  muted: '#87889A',
  faint: '#B3B4C2',
  line: '#ECE8DD',
  hair: '#F3F0E8',
  navy: '#232A4D',
  navyDeep: '#1A1F3B',
  navySoft: '#E9EBF3',
  gold: '#C29A4E',
  goldLt: '#E3C97F',
  goldDeep: '#A67C33',
  goldSoft: '#F4EBD8',
  sage: '#5F8A7B',
  sageDeep: '#4C7264',
  sageSoft: '#E4EDE9',
  bronze: '#B87333',
  bronzeSoft: '#F1E2D2',
  heroGradient: ['#313B6E', '#232A4D', '#161B34'] as const,
  youGradient: ['#2E3766', '#1A1F3B'] as const,
  podiumGold: ['#D8B368', '#B9822F'] as const,
  podiumSilver: ['#2E3766', '#1A1F3B'] as const,
  podiumBronze: ['#6C9A8A', '#4C7264'] as const,
  barGradients: [
    ['#D8B368', '#C29A4E'],
    ['#3A4680', '#232A4D'],
    ['#6C9A8A', '#4C7264'],
    ['#C98A54', '#A9652F'],
  ] as const,
  avatarGradients: [
    ['#D8B368', '#B9822F'],
    ['#2E3766', '#1A1F3B'],
    ['#6C9A8A', '#4C7264'],
    ['#C98A54', '#A9652F'],
  ] as const,
  forYouLift: -22,
  tabBottomPad: FLOATING_TAB_BAR_BOTTOM_PADDING + 24,
} as const;

export function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function truncateName(name: string, maxLen = 13): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLen) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

export function formatStudentCount(count: number): string {
  return count.toLocaleString();
}

export function formatSeasonCountdown(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) {
    return '0d 0h 0m';
  }
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${days}d ${hours}h ${minutes}m`;
}
