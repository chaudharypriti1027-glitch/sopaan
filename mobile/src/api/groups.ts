import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export type StudyGroup = {
  id: string;
  name: string;
  examTag: string;
  members?: string[];
  createdBy?: { name?: string } | string;
  createdAt?: string;
};

export type CreateGroupInput = {
  name: string;
  examTag: string;
};

type RawGroup = StudyGroup & { _id?: string };

function normalizeGroup(raw: RawGroup): StudyGroup {
  return { ...raw, id: raw.id ?? raw._id ?? '' };
}

export async function listGroups(
  params?: PaginationParams & { examTag?: string },
): Promise<PaginatedResponse<StudyGroup>> {
  const { data } = await apiClient.get<PaginatedResponse<RawGroup>>('/groups', { params });
  return { ...data, items: data.items.map(normalizeGroup) };
}

export async function createGroup(input: CreateGroupInput): Promise<StudyGroup> {
  const { data } = await apiClient.post<RawGroup>('/groups', input);
  return normalizeGroup(data);
}

export async function joinGroup(id: string): Promise<StudyGroup> {
  const { data } = await apiClient.post<RawGroup>(`/groups/${id}/join`);
  return normalizeGroup(data);
}
