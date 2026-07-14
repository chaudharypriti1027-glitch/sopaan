import { apiClient } from './client';
import type { McqQuestion } from '../games/types';

export type AffairStudyPack = {
  id: string;
  title: string;
  summary?: string;
  shortAnswer: string | null;
  examTip: string | null;
  keyPoints: string[];
  quizQuestionCount: number;
};

export type AffairQuizGame = {
  affairId: string;
  title: string;
  questions: McqQuestion[];
};

export type DailyRoutineTask = {
  id: string;
  kind: 'planner' | 'current_affair' | 'game';
  title: string;
  subtitle?: string;
  completed: boolean;
  deeplink?: string;
  quizDeeplink?: string | null;
  examTip?: string | null;
  shortAnswer?: string | null;
  keyPoints?: string[];
  affairId?: string;
  gameId?: string;
  durationMin?: number;
  startTime?: string;
  actionType?: string | null;
  actionResourceId?: string | null;
};

export type DailyRoutine = {
  date: string;
  headline: string;
  progress: {
    completed: number;
    total: number;
    progressPct: number;
  };
  digest: {
    id: string;
    title: string;
    summary?: string;
    itemCount: number;
  } | null;
  tasks: DailyRoutineTask[];
  tips: string[];
  generatedAt: string;
};

export async function getTodayDailyRoutine(): Promise<DailyRoutine> {
  const { data } = await apiClient.get<DailyRoutine>('/daily-routine/today');
  return data;
}

export async function getAffairStudyPack(id: string): Promise<AffairStudyPack> {
  const { data } = await apiClient.get<AffairStudyPack>(
    `/current-affairs/${encodeURIComponent(id)}/study-pack`,
  );
  return data;
}

export async function getAffairQuizGame(id: string): Promise<AffairQuizGame> {
  const { data } = await apiClient.get<AffairQuizGame>(
    `/current-affairs/${encodeURIComponent(id)}/quiz-game`,
  );
  return data;
}
