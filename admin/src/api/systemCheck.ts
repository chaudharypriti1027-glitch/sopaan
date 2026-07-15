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

export async function fetchSystemCheck() {
  const data = await apiRequest<SystemCheckResponse | null>('/api/admin/system-check');
  return {
    health: {
      status: data?.health?.status ?? 'unknown',
      mongodb: data?.health?.mongodb ?? 'unknown',
      deployEnv: data?.health?.deployEnv ?? 'unknown',
      nodeEnv: data?.health?.nodeEnv ?? 'unknown',
    },
    integrations: Array.isArray(data?.integrations) ? data.integrations : [],
    content: {
      coursesPublished: data?.content?.coursesPublished ?? 0,
      coursesDraft: data?.content?.coursesDraft ?? 0,
      affairsPublished: data?.content?.affairsPublished ?? 0,
      affairsDraft: data?.content?.affairsDraft ?? 0,
      testsPublished: data?.content?.testsPublished ?? 0,
      testsDraft: data?.content?.testsDraft ?? 0,
      mediaTotal: data?.content?.mediaTotal ?? 0,
    },
    checks: Array.isArray(data?.checks) ? data.checks : [],
    allOk: Boolean(data?.allOk),
    apiOrigin: data?.apiOrigin ?? '',
    assessedAt: data?.assessedAt ?? '',
  };
}
