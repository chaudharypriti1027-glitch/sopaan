import { apiClient } from './client';

export type WellnessSession = {
  id: string;
  title: string;
  category: string;
  durationMin: number;
  description: string;
};

export async function listWellnessSessions(): Promise<{ items: WellnessSession[] }> {
  const { data } = await apiClient.get<{ items: WellnessSession[] }>('/wellness/sessions');
  return data;
}
