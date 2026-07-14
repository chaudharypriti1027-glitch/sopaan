import { apiClient } from './client';
import type { Profile } from '../types/auth';
import type { GameAnswerRecord } from '../games/completion';
import type { GameId } from '../games/types';

export type GameReviewItem = {
  questionId: string;
  prompt: string;
  topic?: string | null;
  selected?: string | null;
  correct: boolean;
  correctAnswer?: string | null;
  explanation?: string | null;
};

export type GameCoaching = {
  feedback: string;
  weakTopics: string[];
  actions: string[];
};

export type CompleteGameInput = {
  gameId: GameId;
  score: number;
  affairId?: string;
  gameTitle?: string;
  answers?: GameAnswerRecord[];
};

export type CompleteGameResponse = {
  coinsAwarded: number;
  xpAwarded: number;
  streak?: Profile['streak'];
  profile: Profile;
  coaching: GameCoaching;
  review: GameReviewItem[];
};

export async function completeGame(input: CompleteGameInput): Promise<CompleteGameResponse> {
  const { data } = await apiClient.post<CompleteGameResponse>('/games/complete', input);
  return data;
}
