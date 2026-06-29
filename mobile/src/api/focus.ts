import { apiClient } from './client';

export type FocusLogInput = {
  focusMinutes: number;
  breaksTaken?: number;
  sessions?: number;
  date?: string;
};

export async function logFocus(input: FocusLogInput): Promise<unknown> {
  const { data } = await apiClient.post('/focus/log', {
    breaksTaken: 0,
    sessions: 1,
    ...input,
  });
  return data;
}
