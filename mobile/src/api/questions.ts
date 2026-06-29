import { apiClient } from './client';

export type QuestionPreview = {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  text: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation?: string;
  language: string;
  source: string;
};

export type RelatedQuestion = {
  id: string;
  text: string;
  subject: string;
  topic: string;
  difficulty: string;
  score: number;
};

export async function getQuestion(id: string): Promise<QuestionPreview> {
  const { data } = await apiClient.get<QuestionPreview>(`/questions/${id}`);
  return data;
}

export async function getRelatedQuestions(
  id: string,
  limit = 5,
): Promise<RelatedQuestion[]> {
  const { data } = await apiClient.get<{ related: RelatedQuestion[] }>(`/questions/${id}/related`, {
    params: { limit },
  });
  return data.related;
}
