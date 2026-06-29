import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export type ContentStatus = 'draft' | 'published';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type QualityIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  metadata?: Record<string, unknown>;
};

export type DuplicateReference = {
  id: string;
  text?: string;
  subject?: string;
  topic?: string;
};

export type AdminAuditUser = {
  _id?: string;
  name?: string;
  email?: string;
};

export type AdminQuestion = {
  id: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation?: string;
  examTags: string[];
  source: string;
  language: 'en' | 'hi';
  status: ContentStatus;
  reviewStatus?: ReviewStatus;
  qualityIssues?: QualityIssue[];
  duplicateOf?: DuplicateReference | null;
  duplicateScore?: number;
  qualityCheckedAt?: string;
  canPublish?: boolean;
  createdBy?: AdminAuditUser;
  updatedBy?: AdminAuditUser;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminExam = {
  _id: string;
  id?: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  status?: ContentStatus;
  createdBy?: AdminAuditUser;
  updatedBy?: AdminAuditUser;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCourse = {
  _id: string;
  id?: string;
  title: string;
  subject: string;
  examTags?: string[];
  isFree?: boolean;
  status?: ContentStatus;
  createdBy?: AdminAuditUser;
  updatedBy?: AdminAuditUser;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCurrentAffair = {
  _id: string;
  id?: string;
  title: string;
  summary?: string;
  category?: string;
  source?: string;
  publishedAt: string;
  status?: ContentStatus;
  createdBy?: AdminAuditUser;
  updatedBy?: AdminAuditUser;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminContentQuery = PaginationParams & {
  q?: string;
  status?: ContentStatus;
  subject?: string;
  category?: string;
};

export type QuestionImportResult = {
  totalRows: number;
  insertedCount: number;
  errorCount: number;
  pendingReviewCount?: number;
  errors: { row: number; errors: { field: string; message: string }[] }[];
};

export type QuestionReviewAction = {
  action: 'fix' | 'merge' | 'reject';
  mergeTargetId?: string;
  updates?: Partial<AdminQuestion>;
};

function withId<T extends { _id?: string; id?: string }>(item: T): T & { id: string } {
  return { ...item, id: item.id ?? item._id ?? '' };
}

export async function listQuestions(
  params?: AdminContentQuery,
): Promise<PaginatedResponse<AdminQuestion>> {
  const { data } = await apiClient.get<PaginatedResponse<AdminQuestion>>('/admin/questions', {
    params,
  });
  return data;
}

export async function listReviewQueue(
  params?: AdminContentQuery,
): Promise<PaginatedResponse<AdminQuestion>> {
  const { data } = await apiClient.get<PaginatedResponse<AdminQuestion>>(
    '/admin/questions/review-queue',
    { params },
  );
  return data;
}

export async function reviewQuestion(
  id: string,
  payload: QuestionReviewAction,
): Promise<AdminQuestion> {
  const { data } = await apiClient.post<AdminQuestion>(`/admin/questions/${id}/review`, payload);
  return data;
}

export async function importQuestionsJson(
  questions: Record<string, unknown>[],
): Promise<QuestionImportResult> {
  const { data } = await apiClient.post<QuestionImportResult>('/admin/questions/import', {
    questions,
  });
  return data;
}

export async function setQuestionStatus(id: string, status: ContentStatus): Promise<AdminQuestion> {
  const { data } = await apiClient.patch<AdminQuestion>(`/admin/questions/${id}/status`, { status });
  return data;
}

export async function deleteQuestion(id: string): Promise<{ id: string; deleted: boolean }> {
  const { data } = await apiClient.delete<{ id: string; deleted: boolean }>(`/admin/questions/${id}`);
  return data;
}

export async function listExams(
  params?: AdminContentQuery,
): Promise<PaginatedResponse<AdminExam>> {
  const { data } = await apiClient.get<PaginatedResponse<AdminExam>>('/admin/exams', { params });
  return { ...data, items: data.items.map(withId) };
}

export async function setExamStatus(id: string, status: ContentStatus): Promise<AdminExam> {
  const { data } = await apiClient.patch<AdminExam>(`/admin/exams/${id}/status`, { status });
  return withId(data);
}

export async function deleteExam(id: string): Promise<{ id: string; deleted: boolean }> {
  const { data } = await apiClient.delete<{ id: string; deleted: boolean }>(`/admin/exams/${id}`);
  return data;
}

export async function listCourses(
  params?: AdminContentQuery,
): Promise<PaginatedResponse<AdminCourse>> {
  const { data } = await apiClient.get<PaginatedResponse<AdminCourse>>('/admin/courses', { params });
  return { ...data, items: data.items.map(withId) };
}

export async function setCourseStatus(id: string, status: ContentStatus): Promise<AdminCourse> {
  const { data } = await apiClient.patch<AdminCourse>(`/admin/courses/${id}/status`, { status });
  return withId(data);
}

export async function deleteCourse(id: string): Promise<{ id: string; deleted: boolean }> {
  const { data } = await apiClient.delete<{ id: string; deleted: boolean }>(`/admin/courses/${id}`);
  return data;
}

export async function listCurrentAffairs(
  params?: AdminContentQuery,
): Promise<PaginatedResponse<AdminCurrentAffair>> {
  const { data } = await apiClient.get<PaginatedResponse<AdminCurrentAffair>>(
    '/admin/current-affairs',
    { params },
  );
  return { ...data, items: data.items.map(withId) };
}

export async function setCurrentAffairStatus(
  id: string,
  status: ContentStatus,
): Promise<AdminCurrentAffair> {
  const { data } = await apiClient.patch<AdminCurrentAffair>(
    `/admin/current-affairs/${id}/status`,
    { status },
  );
  return withId(data);
}

export async function deleteCurrentAffair(id: string): Promise<{ id: string; deleted: boolean }> {
  const { data } = await apiClient.delete<{ id: string; deleted: boolean }>(
    `/admin/current-affairs/${id}`,
  );
  return data;
}
