import { apiClient } from './client';
import { getAppLanguage } from './language';

export type GenerateTestInput = {
  subject: string;
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count: number;
  examTag: string;
  language?: 'en' | 'hi';
  adaptive?: boolean;
};

export type PracticeSuggestion = {
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mode: 'standard' | 'adaptive';
  count: number;
  reason: string;
};

export type PracticeSuggestionsInput = {
  examTag?: string;
  subject?: string;
  topic?: string;
  language?: 'en' | 'hi';
};

export type PracticeSuggestionsResponse = {
  suggestions: PracticeSuggestion[];
  source: 'ai' | 'heuristic';
};

type RawTest = {
  _id?: string;
  id?: string;
  title: string;
  subject: string;
  topic?: string;
  difficulty: string;
  durationSec: number;
  type: string;
  examTag: string;
  status?: string;
};

export async function generateTest(input: GenerateTestInput): Promise<{ id: string; title: string }> {
  const { data } = await apiClient.post<RawTest>(
    '/ai/generate-test',
    {
      ...input,
      language: input.language ?? getAppLanguage(),
    },
    { timeout: 150_000 },
  );

  return {
    id: data.id ?? data._id ?? '',
    title: data.title,
  };
}

export async function getPracticeSuggestions(
  input: PracticeSuggestionsInput,
): Promise<PracticeSuggestionsResponse> {
  const { data } = await apiClient.post<PracticeSuggestionsResponse>(
    '/ai/practice-suggestions',
    {
      ...input,
      language: input.language ?? getAppLanguage(),
    },
    { timeout: 35_000 },
  );
  return data;
}

export type AskDoubtInput = {
  question: string;
  imageBase64?: string;
  language?: 'en' | 'hi';
  skipCache?: boolean;
};

export type AskDoubtMatch = {
  id: string;
  source: 'ai_cache' | 'forum_doubt';
  score: number;
  queryText?: string;
  title?: string;
};

export type AskDoubtResponse = {
  explanation: string;
  fromCache?: boolean;
  cacheSource?: string | null;
  answerId?: string;
  responseMs?: number;
  suggestedMatch?: AskDoubtMatch;
};

export type AiDoubtHistoryItem = {
  id: string;
  question: string;
  explanation: string;
  language: string;
  imageAttached: boolean;
  fromCache: boolean;
  cacheSource?: string | null;
  responseMs?: number;
  createdAt: string;
};

export async function askDoubt(input: AskDoubtInput): Promise<AskDoubtResponse> {
  // Server allows up to ~75s per attempt and may retry a weak answer once.
  const { data } = await apiClient.post<AskDoubtResponse>(
    '/ai/ask',
    {
      ...input,
      language: input.language ?? getAppLanguage(),
    },
    { timeout: 160_000 },
  );
  return data;
}

export async function listDoubtHistory(params?: { limit?: number; offset?: number }) {
  const { data } = await apiClient.get<{
    items: AiDoubtHistoryItem[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  }>('/ai/doubts', { params });
  return data;
}

export type EvaluateAnswerInput = {
  question: string;
  answerText?: string;
  imageBase64?: string;
  maxMarks?: number;
  language?: 'en' | 'hi';
};

export type EvaluateAnswerResponse = {
  score: number;
  subScores: {
    content: number;
    structure: number;
    clarity: number;
  };
  strengths?: string[];
  feedback: string[];
  nextSteps?: string[];
  evaluationId?: string;
  maxMarks?: number;
};

export async function evaluateAnswer(input: EvaluateAnswerInput): Promise<EvaluateAnswerResponse> {
  // Server uses 90s per attempt × up to 2 validation retries — keep client above that.
  const { data } = await apiClient.post<EvaluateAnswerResponse>(
    '/ai/evaluate-answer',
    {
      maxMarks: 15,
      ...input,
      language: input.language ?? getAppLanguage(),
    },
    { timeout: 200_000 },
  );
  return data;
}

export type AiFeedbackFeature =
  | 'doubt_solver'
  | 'answer_evaluation'
  | 'test_generation'
  | 'attempt_coaching';

export type ReportAiFeedbackInput = {
  feature: AiFeedbackFeature;
  reason?: 'inaccurate' | 'off_topic' | 'unsafe' | 'other';
  userComment?: string;
  inputSummary?: string;
  outputSnapshot: Record<string, unknown>;
};

export type ReportAiFeedbackResponse = {
  id: string;
  status: string;
  message: string;
};

export async function reportAiFeedback(
  input: ReportAiFeedbackInput,
): Promise<ReportAiFeedbackResponse> {
  const { data } = await apiClient.post<ReportAiFeedbackResponse>('/ai/report', input);
  return data;
}
