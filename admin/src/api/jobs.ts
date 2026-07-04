import { apiRequest } from './client';

export type JobRunStatus = 'running' | 'completed' | 'failed';
export type JobDefinitionStatus = JobRunStatus | 'never_run';

export type JobLastRun = {
  id: string;
  runKey: string;
  status: JobRunStatus;
  attempt: number;
  startedAt: string;
  completedAt?: string | null;
  triggeredBy: string;
  error?: string | null;
  result?: unknown;
};

export type AdminJobDefinition = {
  id?: string;
  name: string;
  description: string;
  schedule: string;
  scheduleEnv: string;
  defaultSchedule: string;
  period: string;
  timezone: string;
  enabled: boolean;
  status: JobDefinitionStatus;
  lastRun: JobLastRun | null;
};

export type AdminJobsResponse = {
  items: AdminJobDefinition[];
};

export type JobRun = {
  id: string;
  jobName: string;
  runKey: string;
  status: JobRunStatus;
  attempt: number;
  startedAt: string;
  completedAt?: string | null;
  triggeredBy: string;
  error?: string | null;
  result?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type JobRunsResponse = {
  items: JobRun[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type RunJobResponse = {
  queued: boolean;
  queueJobId?: string;
  jobName: string;
  force?: boolean;
  message?: string;
  skipped?: boolean;
  jobRunId?: string;
  result?: unknown;
  reason?: string;
};

export async function listAdminJobs() {
  return apiRequest<AdminJobsResponse>('/api/admin/jobs');
}

export async function listJobRuns(limit = 30, jobName?: string) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (jobName) params.set('jobName', jobName);
  return apiRequest<JobRunsResponse>(`/api/admin/jobs/runs?${params.toString()}`);
}

export async function runAdminJob(jobName: string, force = true) {
  return apiRequest<RunJobResponse>(`/api/admin/jobs/${encodeURIComponent(jobName)}/run`, {
    method: 'POST',
    body: JSON.stringify({ force }),
  });
}
