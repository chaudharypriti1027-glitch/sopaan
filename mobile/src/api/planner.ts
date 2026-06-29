import { apiClient } from './client';
import type { PlannerDayPlan, PlannerSession, PlannerSessionsResponse } from './types';

export type PlannerSessionsParams = {
  date: string;
};

export type CreatePlannerSessionInput = {
  date: string;
  startTime: string;
  durationMin: number;
  subject: string;
  topic?: string;
  type: string;
  reason?: string;
  motivation?: string;
  completed?: boolean;
};

type RawPlannerSession = {
  _id?: string;
  id?: string;
  subject: string;
  topic?: string;
  startTime: string;
  durationMin: number;
  type: string;
  reason?: string;
  motivation?: string;
  completed: boolean;
  date?: string;
};

function normalizeSession(raw: RawPlannerSession): PlannerSession {
  return {
    id: raw.id ?? raw._id ?? '',
    subject: raw.subject,
    topic: raw.topic,
    startTime: raw.startTime,
    durationMin: raw.durationMin,
    type: raw.type,
    reason: raw.reason,
    motivation: raw.motivation,
    completed: raw.completed,
    date: raw.date,
  };
}

export async function listPlannerSessions(
  params: PlannerSessionsParams,
): Promise<PlannerSessionsResponse> {
  const { data } = await apiClient.get<{ items: RawPlannerSession[] }>('/planner/sessions', {
    params,
  });
  return { items: data.items.map(normalizeSession) };
}

export async function createPlannerSession(input: CreatePlannerSessionInput): Promise<PlannerSession> {
  const { data } = await apiClient.post<RawPlannerSession>('/planner/sessions', input);
  return normalizeSession(data);
}

export async function updatePlannerSession(
  id: string,
  input: Partial<CreatePlannerSessionInput> & { completed?: boolean },
): Promise<PlannerSession> {
  const { data } = await apiClient.put<RawPlannerSession>(`/planner/sessions/${id}`, input);
  return normalizeSession(data);
}

export async function generateDayPlan(input?: { date?: string }): Promise<PlannerDayPlan> {
  const { data } = await apiClient.post<{
    date: string;
    summary: string;
    sessions: RawPlannerSession[];
  }>('/planner/generate', input ?? {});

  return {
    date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString(),
    summary: data.summary,
    sessions: data.sessions.map(normalizeSession),
  };
}
