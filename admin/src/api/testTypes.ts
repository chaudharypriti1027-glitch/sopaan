import type { PaginatedResponse } from './questionTypes';

export interface PendingTest {
  id: string;
  title: string;
  subject: string;
  type: string;
  examTag: string;
  status: 'pending_review' | 'published' | 'rejected' | 'draft';
  questionCount: number;
  source: string;
  createdBy: { id: string; name: string; email?: string | null } | null;
  createdAt?: string;
}

export interface GenerateExamPayload {
  exam: string;
  count?: number;
  title?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: 'en' | 'hi';
  sections?: Array<{
    subject: string;
    topic: string;
    count?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }>;
}

export interface GenerateExamResult {
  preview: boolean;
  test: PendingTest;
  totalQuestions: number;
  totalDurationSec: number;
}

export type PendingTestsResponse = PaginatedResponse<PendingTest>;
