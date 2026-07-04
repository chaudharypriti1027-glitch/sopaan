import { apiRequest } from './client';
import type { GenerateExamPayload, GenerateExamResult, PendingTestsResponse } from './testTypes';

export function fetchPendingTests(limit = 50, offset = 0) {
  return apiRequest<PendingTestsResponse>(
    `/api/admin/tests/pending?limit=${limit}&offset=${offset}`,
  );
}

export function reviewTest(id: string, action: 'approve' | 'reject') {
  return apiRequest(`/api/admin/tests/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export function generateExam(payload: GenerateExamPayload) {
  return apiRequest<GenerateExamResult>('/api/admin/generate-exam', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export const DEFAULT_GENERATE_EXAM: GenerateExamPayload = {
  exam: 'SSC CGL',
  count: 10,
  difficulty: 'medium',
  language: 'en',
  sections: [
    { subject: 'Quantitative Aptitude', topic: 'Mixed', count: 10 },
    { subject: 'English', topic: 'Mixed', count: 10 },
    { subject: 'General Intelligence', topic: 'Mixed', count: 10 },
  ],
};
