import { apiClient } from './client';

export type AnalyticsRange = 'week' | 'month' | 'all';

export type ProgressAnalytics = {
  range: AnalyticsRange;
  summary: {
    totalAttempts: number;
    avgAccuracy: number;
    totalStudyHours: number;
  };
  studyHoursTrend: {
    date: string;
    focusMinutes: number;
    focusHours: number;
    sessionsCompleted: number;
  }[];
  accuracyTrend: {
    date: string;
    accuracy: number;
    attempts: number;
  }[];
  subjectMastery: {
    subject: string;
    mastery: number;
    attempts: number;
    delta?: number;
  }[];
};

export async function getProgressAnalytics(range: AnalyticsRange = 'week'): Promise<ProgressAnalytics> {
  const { data } = await apiClient.get<ProgressAnalytics>('/analytics/progress', {
    params: { range },
  });
  return data;
}
