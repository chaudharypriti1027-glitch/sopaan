import { apiRequest } from './client';
import type { AdminExam, ContentListParams, PaginatedResponse, PublishStatus } from './contentTypes';
import { normalizeDoc, normalizeList } from './normalize';

function toQuery(params: ContentListParams) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export type ExamInput = {
  name: string;
  code: string;
  category: string;
  description?: string;
  status?: PublishStatus;
};

export async function fetchExams(params: ContentListParams = {}) {
  const data = await apiRequest<PaginatedResponse<AdminExam>>(`/api/admin/exams${toQuery(params)}`);
  return normalizeList(data);
}

export async function fetchExam(id: string) {
  const data = await apiRequest<AdminExam>(`/api/admin/exams/${id}`);
  return normalizeDoc(data);
}

export async function createExam(body: ExamInput) {
  const data = await apiRequest<AdminExam>('/api/admin/exams', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return normalizeDoc(data);
}

export async function updateExam(id: string, body: Partial<ExamInput>) {
  const data = await apiRequest<AdminExam>(`/api/admin/exams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return normalizeDoc(data);
}

export async function setExamStatus(id: string, status: PublishStatus) {
  const data = await apiRequest<AdminExam>(`/api/admin/exams/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return normalizeDoc(data);
}

export async function deleteExam(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/api/admin/exams/${id}`, {
    method: 'DELETE',
  });
}
