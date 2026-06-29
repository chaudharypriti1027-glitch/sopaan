import { apiClient } from './client';
import type { Profile } from '../types/auth';
import type { GameId } from '../games/types';

export type CompleteGameInput = {
  gameId: GameId;
  score: number;
};

export type CompleteGameResponse = {
  coinsAwarded: number;
  xpAwarded: number;
  streak?: Profile['streak'];
  profile: Profile;
};

export async function completeGame(input: CompleteGameInput): Promise<CompleteGameResponse> {
  const { data } = await apiClient.post<CompleteGameResponse>('/games/complete', input);
  return data;
}
