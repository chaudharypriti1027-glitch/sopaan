import { apiClient } from './client';
import { withLanguageParams } from './language';
import type { AppLanguage } from '../language/types';
import type { PaginatedResponse, PaginationParams } from './types';

export type RevisionCapsule = {
  id: string;
  title: string;
  subject: string;
  readMinutes?: number;
  body: string;
  bookmarkable?: boolean;
};

type RawCapsule = RevisionCapsule & { _id?: string };

function normalizeCapsule(raw: RawCapsule): RevisionCapsule {
  return {
    id: raw.id ?? raw._id ?? raw.title,
    title: raw.title,
    subject: raw.subject,
    readMinutes: raw.readMinutes,
    body: raw.body,
    bookmarkable: raw.bookmarkable,
  };
}

export async function listRevisionCapsules(
  params?: PaginationParams & { subject?: string; language?: AppLanguage },
): Promise<PaginatedResponse<RevisionCapsule>> {
  const { data } = await apiClient.get<PaginatedResponse<RawCapsule>>('/revision-capsules', {
    params: withLanguageParams(params),
  });
  return { ...data, items: data.items.map(normalizeCapsule) };
}
