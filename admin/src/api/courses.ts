import { apiRequest } from './client';
import type { AdminCourse, ContentListParams, PaginatedResponse, PublishStatus } from './contentTypes';
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

export type CourseInput = {
  title: string;
  subject: string;
  examTags?: string[];
  isFree?: boolean;
  thumbnailColor?: string;
  thumbnailUrl?: string;
  status?: PublishStatus;
};

export async function fetchCourses(params: ContentListParams = {}) {
  const data = await apiRequest<PaginatedResponse<AdminCourse>>(
    `/api/admin/courses${toQuery(params)}`,
  );
  return normalizeList(data);
}

export async function fetchCourse(id: string) {
  const data = await apiRequest<AdminCourse>(`/api/admin/courses/${id}`);
  return normalizeDoc(data);
}

export async function createCourse(body: CourseInput) {
  const data = await apiRequest<AdminCourse>('/api/admin/courses', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return normalizeDoc(data);
}

export async function updateCourse(id: string, body: Partial<CourseInput>) {
  const data = await apiRequest<AdminCourse>(`/api/admin/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return normalizeDoc(data);
}

export async function setCourseStatus(id: string, status: PublishStatus) {
  const data = await apiRequest<AdminCourse>(`/api/admin/courses/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return normalizeDoc(data);
}

export async function deleteCourse(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/api/admin/courses/${id}`, {
    method: 'DELETE',
  });
}
