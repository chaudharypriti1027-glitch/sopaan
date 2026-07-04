import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export type AdminStats = {
  activeStudents: number;
  totalStudents: number;
  testsPublished: number;
  liveClasses: number;
  pendingReviews: number;
  pendingQuestionReviews: number;
  coursesPublished: number;
  examsTotal: number;
  questionsTotal: number;
  currentAffairsPublished: number;
  mentorsTotal: number;
  attemptsLast30Days: number;
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
  const { data } = await apiClient.get<Partial<AdminStats>>('/admin/stats');
  return {
    activeStudents: data.activeStudents ?? 0,
    totalStudents: data.totalStudents ?? 0,
    testsPublished: data.testsPublished ?? 0,
    liveClasses: data.liveClasses ?? 0,
    pendingReviews: data.pendingReviews ?? 0,
    pendingQuestionReviews: data.pendingQuestionReviews ?? 0,
    coursesPublished: data.coursesPublished ?? 0,
    examsTotal: data.examsTotal ?? 0,
    questionsTotal: data.questionsTotal ?? 0,
    currentAffairsPublished: data.currentAffairsPublished ?? 0,
    mentorsTotal: data.mentorsTotal ?? 0,
    attemptsLast30Days: data.attemptsLast30Days ?? 0,
    assessedAt: data.assessedAt ?? new Date().toISOString(),
  };
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
