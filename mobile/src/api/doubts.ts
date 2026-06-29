import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export type DoubtPost = {
  id: string;
  title: string;
  body: string;
  subject: string;
  votes?: number;
  answers?: {
    id?: string;
    _id?: string;
    body: string;
    votes?: number;
    userId?: { name?: string } | string;
    createdAt?: string;
  }[];
  userId?: { name?: string } | string;
  createdAt?: string;
};

export type CreateDoubtInput = {
  title: string;
  body: string;
  subject: string;
};

type RawDoubt = DoubtPost & { _id?: string };

function normalizeDoubt(raw: RawDoubt): DoubtPost {
  return { ...raw, id: raw.id ?? raw._id ?? '' };
}

export async function listDoubts(
  params?: PaginationParams & { subject?: string },
): Promise<PaginatedResponse<DoubtPost>> {
  const { data } = await apiClient.get<PaginatedResponse<RawDoubt>>('/doubts', { params });
  return { ...data, items: data.items.map(normalizeDoubt) };
}

export async function createDoubt(input: CreateDoubtInput): Promise<DoubtPost> {
  const { data } = await apiClient.post<RawDoubt>('/doubts', input);
  return normalizeDoubt(data);
}

export async function answerDoubt(id: string, body: string): Promise<DoubtPost> {
  const { data } = await apiClient.post<RawDoubt>(`/doubts/${id}/answer`, { body });
  return normalizeDoubt(data);
}

export async function voteDoubt(
  id: string,
  target: 'post' | 'answer' = 'post',
  answerId?: string,
): Promise<DoubtPost> {
  const { data } = await apiClient.post<RawDoubt>(`/doubts/${id}/vote`, { target, answerId });
  return normalizeDoubt(data);
}
