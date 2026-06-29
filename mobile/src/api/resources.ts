import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export async function listBooks(params?: PaginationParams & { examId?: string }): Promise<unknown> {
  const { data } = await apiClient.get('/books', { params });
  return data;
}

export async function listRevisionCapsules(
  params?: PaginationParams,
): Promise<PaginatedResponse<unknown>> {
  const { data } = await apiClient.get<PaginatedResponse<unknown>>('/revision-capsules', { params });
  return data;
}

export async function getTodaysVocabulary(): Promise<unknown> {
  const { data } = await apiClient.get('/vocabulary/today');
  return data;
}

export async function listMentors(params?: PaginationParams): Promise<PaginatedResponse<unknown>> {
  const { data } = await apiClient.get<PaginatedResponse<unknown>>('/mentors', { params });
  return data;
}

export async function listRewards(params?: PaginationParams): Promise<PaginatedResponse<unknown>> {
  const { data } = await apiClient.get<PaginatedResponse<unknown>>('/rewards', { params });
  return data;
}

export async function listDoubts(params?: PaginationParams): Promise<PaginatedResponse<unknown>> {
  const { data } = await apiClient.get<PaginatedResponse<unknown>>('/doubts', { params });
  return data;
}
