import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export type PhysicalStandard = {
  testType: string;
  label: string;
  unit: string;
  targetMax?: number;
  targetMin?: number;
};

export type PhysicalLog = {
  id?: string;
  _id?: string;
  testType: string;
  value: number;
  unit: string;
  date: string;
};

export type PhysicalComparison = PhysicalStandard & {
  latest?: { value: number; unit: string; date: string } | null;
  status: 'missing' | 'met' | 'below';
  gap: number | null;
};

export type PhysicalFitnessPlan = {
  goal: string;
  standards: PhysicalComparison[];
  plan: string[];
};

export type CreatePhysicalLogInput = {
  testType: string;
  value: number;
  unit: string;
  date?: string;
};

export async function getStandards(goal?: string): Promise<{ goal: string; standards: PhysicalStandard[] }> {
  const { data } = await apiClient.get<{ goal: string; standards: PhysicalStandard[] }>('/physical/standards', {
    params: goal ? { goal } : undefined,
  });
  return data;
}

export async function getFitnessPlan(goal?: string): Promise<PhysicalFitnessPlan> {
  const { data } = await apiClient.get<PhysicalFitnessPlan>('/physical/plan', {
    params: goal ? { goal } : undefined,
  });
  return data;
}

export async function listPhysicalLogs(
  params?: PaginationParams & { testType?: string },
): Promise<PaginatedResponse<PhysicalLog>> {
  const { data } = await apiClient.get<PaginatedResponse<PhysicalLog>>('/physical/logs', { params });
  return {
    ...data,
    items: data.items.map((item) => ({ ...item, id: item.id ?? item._id ?? '' })),
  };
}

export async function createPhysicalLog(input: CreatePhysicalLogInput): Promise<PhysicalLog> {
  const { data } = await apiClient.post<PhysicalLog>('/physical/logs', input);
  return { ...data, id: data.id ?? data._id ?? '' };
}
