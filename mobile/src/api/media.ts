import { apiClient } from './client';

export type ImageUploadFile = {
  uri: string;
  name: string;
  type: string;
};

export type ImageUploadResponse = {
  url: string;
  provider: string;
};

export async function uploadImage(
  file: ImageUploadFile,
  purpose = 'general',
): Promise<ImageUploadResponse> {
  const form = new FormData();
  form.append('image', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
  form.append('purpose', purpose);

  const { data } = await apiClient.post<ImageUploadResponse>('/media/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export type DocumentUploadFile = {
  uri: string;
  name: string;
  type: string;
};

export type DocumentUploadResponse = {
  url: string;
  name: string;
  mimeType: string;
  provider: string;
};

export async function uploadDocument(
  file: DocumentUploadFile,
  purpose = 'chat',
): Promise<DocumentUploadResponse> {
  const form = new FormData();
  form.append('document', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
  form.append('purpose', purpose);

  const { data } = await apiClient.post<DocumentUploadResponse>('/media/document', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
