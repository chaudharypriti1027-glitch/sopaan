import { apiRequest } from './client';

export type AiFeedbackItem = {
  id: string;
  feature: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  reason: string;
  userComment?: string | null;
  inputSummary?: string | null;
  questionText?: string | null;
  outputSnapshot: Record<string, unknown>;
  evaluationId?: string | null;
  attemptId?: string | null;
  maxMarks: number;
  aiGrade: number | null;
  finalGrade: number | null;
  effectiveGrade: number | null;
  reviewAction?: 'keep' | 'override' | null;
  adminNotes?: string | null;
  student: {
    id: string | null;
    name: string;
    email: string | null;
  };
  userName: string;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiFeedbackResponse = {
  items: AiFeedbackItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export async function listAiFeedback(params?: {
  status?: string;
  feature?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  search.set('limit', String(params?.limit ?? 50));
  if (params?.feature) search.set('feature', params.feature);
  const query = search.toString();
  return apiRequest<AiFeedbackResponse>(`/api/admin/ai-feedback?${query}`);
}

export async function reviewAiFeedback(
  id: string,
  body: { action: 'keep' | 'override'; grade?: number; note?: string },
) {
  return apiRequest<AiFeedbackItem>(`/api/admin/ai-feedback/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
