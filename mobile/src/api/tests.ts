import { apiClient } from './client';
import type {
  PaginatedResponse,
  PaginationParams,
  SubmitTestResponse,
  TestDetail,
  TestQuestion,
  TestSummary,
} from './types';

export type ListTestsParams = PaginationParams & {
  type?: 'mock' | 'sectional' | 'pyq' | 'community' | 'series';
  subject?: string;
  examTag?: string;
};

export type SubmitAnswerInput = {
  questionId: string;
  selectedKey?: string;
  timeSec?: number;
};

export type SubmitTestInput = {
  answers: SubmitAnswerInput[];
};

type RawQuestion = TestQuestion & { _id?: string };
type RawTestSummary = TestSummary & { _id?: string };
type RawTestDetail = TestDetail & { _id?: string; questions?: RawQuestion[] };

function normalizeQuestion(raw: RawQuestion): TestQuestion {
  return {
    id: raw.id ?? raw._id ?? '',
    text: raw.text,
    options: raw.options ?? [],
    correctKey: raw.correctKey,
    explanation: raw.explanation,
    subject: raw.subject,
    topic: raw.topic,
    difficulty: raw.difficulty,
  };
}

function normalizeSummary(raw: RawTestSummary): TestSummary {
  return {
    id: raw.id ?? raw._id ?? '',
    title: raw.title,
    subject: raw.subject,
    topic: raw.topic,
    difficulty: raw.difficulty,
    durationSec: raw.durationSec,
    type: raw.type,
    examTag: raw.examTag,
    questionCount: raw.questionCount,
    stats: raw.stats,
  };
}

function normalizeTestDetail(raw: RawTestDetail): TestDetail {
  return {
    ...normalizeSummary(raw),
    questions: (raw.questions ?? []).map(normalizeQuestion),
  };
}

export async function listTests(params?: ListTestsParams): Promise<PaginatedResponse<TestSummary>> {
  const { data } = await apiClient.get<PaginatedResponse<RawTestSummary>>('/tests', { params });
  return {
    ...data,
    items: (data.items ?? []).map(normalizeSummary),
  };
}

export async function getTest(id: string): Promise<TestDetail> {
  const { data } = await apiClient.get<RawTestDetail>(`/tests/${id}`);
  return normalizeTestDetail(data);
}

export async function submitTest(id: string, input: SubmitTestInput): Promise<SubmitTestResponse> {
  const { data } = await apiClient.post<SubmitTestResponse>(`/tests/${id}/submit`, input);
  return normalizeSubmitTestResponse(data);
}

type RawSubmitAttempt = SubmitTestResponse['attempt'] & { _id?: string };

function normalizeSubmitTestResponse(raw: SubmitTestResponse): SubmitTestResponse {
  const attempt = raw.attempt as RawSubmitAttempt;

  return {
    ...raw,
    attempt: {
      ...attempt,
      id: String(attempt.id ?? attempt._id ?? ''),
      testId: String(attempt.testId ?? ''),
    },
    coaching: {
      feedback: raw.coaching?.feedback ?? '',
      weakTopics: raw.coaching?.weakTopics ?? [],
      actions: raw.coaching?.actions ?? [],
    },
    answers: (raw.answers ?? []).map((answer) => ({
      ...answer,
      questionId: String(answer.questionId),
      question: answer.question ?? undefined,
    })),
  };
}

export type ListCommunityTestsParams = PaginationParams & {
  published?: boolean;
  mine?: boolean;
};

export type CommunityQuestionInput = {
  text: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: { key: string; text: string }[];
  correctKey: string;
  explanation?: string;
};

export type CreateCommunityTestInput = {
  title: string;
  subject: string;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  durationSec: number;
  examTag: string;
  status: 'draft' | 'published';
  questions: CommunityQuestionInput[];
};

export async function listCommunityTests(
  params?: ListCommunityTestsParams,
): Promise<PaginatedResponse<TestSummary>> {
  const { data } = await apiClient.get<PaginatedResponse<RawTestSummary>>('/tests/community', {
    params: {
      ...params,
      published: params?.published === undefined ? undefined : String(params.published),
      mine: params?.mine === undefined ? undefined : String(params.mine),
    },
  });
  return {
    ...data,
    items: (data.items ?? []).map(normalizeSummary),
  };
}

export async function createCommunityTest(
  input: CreateCommunityTestInput,
): Promise<TestSummary> {
  const { data } = await apiClient.post<RawTestSummary>('/tests/community', input);
  return normalizeSummary(data);
}
