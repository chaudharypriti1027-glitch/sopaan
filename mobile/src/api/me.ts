import { apiClient } from './client';
import type { EducationLevel, Profile, ProfileCategory, ProfileLanguage } from '../types/auth';

export type UpdateMeInput = {
  name?: string;
  email?: string;
  /** Pass empty string to remove a custom photo. */
  avatarUrl?: string;
  state?: string;
  category?: ProfileCategory;
  targetExam?: string;
  examDate?: string | null;
  language?: ProfileLanguage;
  educationLevel?: EducationLevel;
};

export type ProfileSummary = {
  courses: number;
  savedQuestions: number;
  mistakes: number;
  achievements: number;
  coins: number;
  downloads: number;
  rank: number | null;
  streak: number;
  level: number;
  accuracy: number | null;
  xp: number;
};

export async function getMe(): Promise<Profile> {
  const { data } = await apiClient.get<Profile>('/me');
  return data;
}

export async function getProfileSummary(): Promise<ProfileSummary> {
  const { data } = await apiClient.get<ProfileSummary>('/me/summary');
  return data;
}

export async function updateMe(input: UpdateMeInput): Promise<Profile> {
  const { data } = await apiClient.put<Profile>('/me', input);
  return data;
}

export type AvatarUploadFile = {
  uri: string;
  name: string;
  type: string;
};

export async function uploadAvatar(file: AvatarUploadFile): Promise<Profile> {
  const form = new FormData();
  form.append('avatar', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const { data } = await apiClient.post<Profile>('/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
