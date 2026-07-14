import { apiRequest } from './client';

export type SystemCheckItem = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type SystemCheckResponse = {
  health: {
    status: string;
    mongodb: string;
    deployEnv: string;
    nodeEnv: string;
  };
  integrations: Array<{ name: string; configured: boolean; required: boolean }>;
  content: {
    coursesPublished: number;
    coursesDraft: number;
    affairsPublished: number;
    affairsDraft: number;
    testsPublished: number;
    testsDraft: number;
    mediaTotal: number;
  };
  checks: SystemCheckItem[];
  allOk: boolean;
  apiOrigin: string;
  assessedAt: string;
};

export function fetchSystemCheck() {
  return apiRequest<SystemCheckResponse>('/api/admin/system-check');
}
