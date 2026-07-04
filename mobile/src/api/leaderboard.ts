import { apiClient } from './client';
import type { PaginationMeta, PaginationParams } from './types';
export type LeaderboardPeriod = 'daily' | 'weekly' | 'all-time';

export type LeaderboardEntry = {
  rank: number | null;
  userId: string;
  name: string;
  avgAccuracy: number;
  bestRank?: number | null;
  attempts: number;
  latestAccuracy: number;
  rankDelta?: number | null;
};

export type LeaderboardMeta = {
  totalPlayers: number;
  onlineNow: number;
  season: {
    label: string;
    endsAt: string;
  };
};

export type LeaderboardQueryParams = PaginationParams & {
  period?: LeaderboardPeriod;
};

export type LeaderboardResponse = {
  items: LeaderboardEntry[];
  pagination: PaginationMeta;
  you: LeaderboardEntry;
  meta: LeaderboardMeta;
  period: LeaderboardPeriod;
  updatedAt: string;
};

export async function getLeaderboard(params?: LeaderboardQueryParams): Promise<LeaderboardResponse> {
  const { data } = await apiClient.get<LeaderboardResponse>('/leaderboard', { params });
  return data;
}
