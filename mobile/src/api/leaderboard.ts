import { apiClient } from './client';
import type { PaginationParams } from './types';

export type LeaderboardEntry = {
  rank: number | null;
  userId: string;
  name: string;
  avgAccuracy: number;
  bestRank?: number | null;
  attempts: number;
  latestAccuracy: number;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  you: LeaderboardEntry;
  updatedAt: string;
};

export async function getLeaderboard(params?: PaginationParams): Promise<LeaderboardResponse> {
  const { data } = await apiClient.get<LeaderboardResponse>('/leaderboard', { params });
  return data;
}
