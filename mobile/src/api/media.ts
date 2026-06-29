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
