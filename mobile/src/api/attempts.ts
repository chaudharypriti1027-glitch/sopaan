import { apiClient } from './client';
import type { AttemptDetail, AttemptSummary, PaginatedResponse, PaginationParams } from './types';

export type ListAttemptsParams = PaginationParams & {
  testId?: string;
};

export async function listAttempts(
  params?: ListAttemptsParams,
): Promise<PaginatedResponse<AttemptSummary>> {
  const { data } = await apiClient.get<PaginatedResponse<AttemptSummary>>('/attempts', { params });
  return data;
}

export async function getAttempt(id: string): Promise<AttemptDetail> {
  const { data } = await apiClient.get<AttemptDetail>(`/attempts/${id}`);
  return data;
}
