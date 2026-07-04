import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export type MentorSlot = {
  start: string;
  isBooked?: boolean;
};

export type Mentor = {
  id: string;
  name?: string;
  expertise?: string[];
  rating?: number;
  sessionsCount?: number;
  bio?: string;
  rate?: number;
  avatarUrl?: string;
  slots?: MentorSlot[];
  availableSlots?: MentorSlot[];
  userId?: { name?: string; email?: string } | string;
};

type RawMentor = Mentor & { _id?: string };

function normalizeMentor(raw: RawMentor): Mentor {
  return { ...raw, id: raw.id ?? raw._id ?? '' };
}

export async function listMentors(
  params?: PaginationParams & { expertise?: string },
): Promise<PaginatedResponse<Mentor>> {
  const { data } = await apiClient.get<PaginatedResponse<RawMentor>>('/mentors', { params });
  return { ...data, items: data.items.map(normalizeMentor) };
}

export async function getMentor(id: string): Promise<Mentor> {
  const { data } = await apiClient.get<RawMentor>(`/mentors/${id}`);
  return normalizeMentor(data);
}

export async function bookMentor(id: string, slotStart: string): Promise<unknown> {
  const { data } = await apiClient.post(`/mentors/${id}/book`, { slotStart });
  return data;
}
