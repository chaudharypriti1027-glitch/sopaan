import { apiClient } from './client';
import type { PaginationParams, ProfileResponse, ReadinessResponse, StudentProfile } from './types';

export type UpdateProfileInput = Partial<
  Pick<StudentProfile, 'education' | 'category' | 'state' | 'attemptNumber' | 'targetYear'> & {
    preferences: Record<string, unknown>;
  }
>;

export type UpdateGoalInput = {
  examTrack: string;
  targetYear: number;
};

export async function getProfile(): Promise<ProfileResponse> {
  const { data } = await apiClient.get<ProfileResponse>('/profile');
  return data;
}

export async function updateProfile(input: UpdateProfileInput): Promise<ProfileResponse> {
  const { data } = await apiClient.put<ProfileResponse>('/profile', input);
  return data;
}

export async function updateGoal(input: UpdateGoalInput): Promise<unknown> {
  const { data } = await apiClient.put('/profile/goal', input);
  return data;
}

export async function getGoal(): Promise<import('./types').GoalResponse> {
  const { data } = await apiClient.get<import('./types').GoalResponse>('/profile/goal');
  return data;
}

export async function getReadiness(): Promise<ReadinessResponse> {
  const { data } = await apiClient.get<ReadinessResponse>('/profile/readiness');
  return data;
}

export async function getAnalyticsProgress(params?: PaginationParams): Promise<unknown> {
  const { data } = await apiClient.get('/analytics/progress', { params });
  return data;
}
