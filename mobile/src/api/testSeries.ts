import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export type MockScheduleState = 'locked' | 'live' | 'available';

export type TestSeriesMock = {
  index: number;
  testId: string;
  title: string;
  subject?: string;
  durationSec?: number;
  unlockDate: string;
  isLive: boolean;
  state: MockScheduleState;
};

export type TestSeries = {
  id: string;
  title: string;
  examTag: string;
  enrolled: boolean;
  mockCount: number;
  mocks: TestSeriesMock[];
  createdAt?: string;
};

type RawTestSeries = TestSeries & { _id?: string };

function normalizeSeries(raw: RawTestSeries): TestSeries {
  return {
    id: raw.id ?? raw._id ?? '',
    title: raw.title,
    examTag: raw.examTag,
    enrolled: raw.enrolled,
    mockCount: raw.mockCount,
    mocks: raw.mocks ?? [],
    createdAt: raw.createdAt,
  };
}

export async function listTestSeries(
  params?: PaginationParams & { examTag?: string },
): Promise<PaginatedResponse<TestSeries>> {
  const { data } = await apiClient.get<PaginatedResponse<RawTestSeries>>('/test-series', { params });
  return { ...data, items: data.items.map(normalizeSeries) };
}

export async function getTestSeries(id: string): Promise<TestSeries> {
  const { data } = await apiClient.get<RawTestSeries>(`/test-series/${id}`);
  return normalizeSeries(data);
}

export async function enrollTestSeries(id: string): Promise<TestSeries> {
  const { data } = await apiClient.post<RawTestSeries>(`/test-series/${id}/enroll`);
  return normalizeSeries(data);
}
