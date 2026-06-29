import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export type Reward = {
  id: string;
  title: string;
  type: string;
  coinCost: number;
  icon?: string;
};

export type Badge = {
  id?: string;
  _id?: string;
  key: string;
  earnedAt: string;
};

type RawReward = Reward & { _id?: string };

export async function listRewards(params?: PaginationParams): Promise<PaginatedResponse<Reward>> {
  const { data } = await apiClient.get<PaginatedResponse<RawReward>>('/rewards', { params });
  return {
    ...data,
    items: data.items.map((item) => ({ ...item, id: item.id ?? item._id ?? item.title })),
  };
}

export async function redeemReward(id: string): Promise<{ reward: Reward; coinsRemaining: number }> {
  const { data } = await apiClient.post<{ reward: RawReward; coinsRemaining: number }>(
    `/rewards/${id}/redeem`,
  );
  return {
    ...data,
    reward: { ...data.reward, id: data.reward.id ?? data.reward._id ?? id },
  };
}

export async function listBadges(): Promise<Badge[]> {
  const { data } = await apiClient.get<Badge[]>('/badges');
  return data.map((badge) => ({ ...badge, id: badge.id ?? badge._id ?? badge.key }));
}
