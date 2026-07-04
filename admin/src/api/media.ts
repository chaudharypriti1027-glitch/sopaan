import { apiRequest } from './client';
import type { PaginatedResponse } from './contentTypes';
import { normalizeDoc, normalizeList } from './normalize';

export interface MediaUploader {
  id: string;
  name: string | null;
}

export interface AdminMedia {
  id: string;
  key: string;
  url: string;
  type: string;
  sizeBytes: number;
  uploadedBy: MediaUploader;
  at: string;
}

export interface MediaListParams {
  kind?: 'image' | 'video';
  limit?: number;
  offset?: number;
}

export interface MediaPresignResponse {
  mode: 'presigned' | 'direct';
  method: 'PUT' | 'POST';
  uploadUrl: string;
  uploadToken: string | null;
  key: string;
  publicUrl: string;
  headers: Record<string, string>;
}

function toQuery(params: MediaListParams) {
  const search = new URLSearchParams();
  if (params.kind) search.set('kind', params.kind);
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchMedia(params: MediaListParams = {}) {
  const data = await apiRequest<PaginatedResponse<AdminMedia>>(`/api/admin/media${toQuery(params)}`);
  return normalizeList(data);
}

export async function presignMediaUpload(body: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}) {
  return apiRequest<MediaPresignResponse>('/api/admin/media', {
    method: 'POST',
    body: JSON.stringify({ action: 'presign', ...body }),
  });
}

export async function completeMediaUpload(body: {
  key: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const data = await apiRequest<AdminMedia>('/api/admin/media', {
    method: 'POST',
    body: JSON.stringify({ action: 'complete', ...body }),
  });
  return normalizeDoc(data);
}

export async function deleteMedia(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/api/admin/media/${id}`, {
    method: 'DELETE',
  });
}
