import { apiRequest } from './client';
import type {
  AdminQuestion,
  PaginatedResponse,
  QuestionImportResult,
  QuestionListParams,
} from './questionTypes';

function toQuery(params: QuestionListParams) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.reviewStatus) search.set('reviewStatus', params.reviewStatus);
  if (params.subject) search.set('subject', params.subject);
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function fetchQuestions(params: QuestionListParams = {}) {
  return apiRequest<PaginatedResponse<AdminQuestion>>(`/api/admin/questions${toQuery(params)}`);
}

export function fetchReviewQueue(params: QuestionListParams = {}) {
  return apiRequest<PaginatedResponse<AdminQuestion>>(
    `/api/admin/questions/review-queue${toQuery(params)}`,
  );
}

export function setQuestionStatus(id: string, status: 'draft' | 'published') {
  return apiRequest<AdminQuestion>(`/api/admin/questions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteQuestion(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/api/admin/questions/${id}`, {
    method: 'DELETE',
  });
}

export function importQuestionsJson(questions: unknown[]) {
  return apiRequest<QuestionImportResult>('/api/admin/questions/import', {
    method: 'POST',
    body: JSON.stringify({ questions }),
  });
}

export function recheckQuestion(id: string) {
  return apiRequest<AdminQuestion>(`/api/admin/questions/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ action: 'recheck' }),
  });
}

export function mergeQuestion(id: string, into: string) {
  return apiRequest<AdminQuestion>(`/api/admin/questions/${id}/merge`, {
    method: 'POST',
    body: JSON.stringify({ into }),
  });
}

export function rejectQuestion(id: string) {
  return apiRequest<AdminQuestion>(`/api/admin/questions/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ action: 'reject' }),
  });
}
