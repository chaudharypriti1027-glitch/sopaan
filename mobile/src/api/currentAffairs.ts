import { apiClient } from './client';
import type { CurrentAffair, PaginatedResponse, PaginationParams } from './types';

export type ListCurrentAffairsParams = PaginationParams & {
  category?: string;
  date?: string;
  month?: string;
  state?: string;
};

export type CurrentAffairDigest = {
  id: string;
  digestDate: string;
  title: string;
  summary?: string;
  itemCount: number;
  affairs: CurrentAffair[];
};

type RawAffair = CurrentAffair & { _id?: string };

function normalizeAffair(raw: RawAffair): CurrentAffair {
  return {
    ...raw,
    id: raw.id ?? raw._id ?? '',
    quizQuestions: raw.quizQuestions?.map((q) =>
      typeof q === 'string' ? q : (q as { _id?: string })._id ?? '',
    ),
  };
}

export async function listCurrentAffairs(
  params?: ListCurrentAffairsParams,
): Promise<PaginatedResponse<CurrentAffair>> {
  const { data } = await apiClient.get<PaginatedResponse<RawAffair>>('/current-affairs', {
    params,
  });
  return { ...data, items: data.items.map(normalizeAffair) };
}

export async function getCurrentAffair(id: string): Promise<CurrentAffair> {
  const { data } = await apiClient.get<RawAffair>(`/current-affairs/${encodeURIComponent(id)}`);
  return normalizeAffair(data);
}

export async function getTodayDigest(): Promise<CurrentAffairDigest> {
  const { data } = await apiClient.get<CurrentAffairDigest>('/current-affairs/digest/today');
  return data;
}
