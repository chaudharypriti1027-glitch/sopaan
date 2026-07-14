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

export type AffairAiSummary = {
  affairId: string;
  title: string;
  summary: string | null;
  shortAnswer: string | null;
  examTip: string | null;
  keyPoints: string[];
  category: string | null;
  source: 'cached' | 'generated';
  generatedAt: string;
};

type RawAffair = CurrentAffair & { _id?: string };

function normalizeAffair(raw: RawAffair): CurrentAffair {
  const quizQuestions = raw.quizQuestions?.map((q) =>
    typeof q === 'string' ? q : (q as { _id?: string })._id ?? '',
  );

  return {
    ...raw,
    id: raw.id ?? raw._id ?? '',
    quizQuestions,
    quizQuestionCount:
      typeof raw.quizQuestionCount === 'number'
        ? raw.quizQuestionCount
        : quizQuestions?.length ?? 0,
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

export async function getAffairAiSummary(
  id: string,
  params?: { language?: 'en' | 'hi' },
): Promise<AffairAiSummary> {
  const { data } = await apiClient.get<AffairAiSummary>(
    `/current-affairs/${encodeURIComponent(id)}/ai-summary`,
    { params },
  );
  return data;
}
