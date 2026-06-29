import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export type AdminStats = {
  activeStudents: number;
  totalStudents: number;
  testsPublished: number;
  liveClasses: number;
  pendingReviews: number;
  assessedAt: string;
};

export type PendingTest = {
  id?: string;
  _id?: string;
  title: string;
  subject?: string;
  status: string;
  createdBy?: { name?: string; email?: string };
  createdAt?: string;
};

export type GenerateExamInput = {
  title: string;
  examTag: string;
  language?: 'en' | 'hi';
  difficulty?: 'easy' | 'medium' | 'hard';
  publish?: boolean;
  sections: {
    subject: string;
    topic: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    count: number;
  }[];
};

type RawPendingTest = PendingTest & { _id?: string };

export async function getStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>('/admin/stats');
  return data;
}

export async function listPendingTests(
  params?: PaginationParams,
): Promise<PaginatedResponse<PendingTest>> {
  const { data } = await apiClient.get<PaginatedResponse<RawPendingTest>>('/admin/tests/pending', {
    params,
  });
  return {
    ...data,
    items: data.items.map((item) => ({ ...item, id: item.id ?? item._id ?? '' })),
  };
}

export async function reviewTest(id: string, decision: 'approve' | 'reject'): Promise<PendingTest> {
  const { data } = await apiClient.post<RawPendingTest>(`/admin/tests/${id}/review`, { decision });
  return { ...data, id: data.id ?? data._id ?? id };
}

export async function generateExam(input: GenerateExamInput): Promise<{ id: string; title: string }> {
  const { data } = await apiClient.post<{ id?: string; _id?: string; title: string }>(
    '/admin/generate-exam',
    input,
  );
  return { id: data.id ?? data._id ?? '', title: data.title };
}
