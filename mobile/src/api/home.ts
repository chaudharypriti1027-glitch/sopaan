import { apiClient } from './client';
import type { HomeFeed } from '../types/home';

export type GetHomeFeedOptions = {
  /** ETag from a prior feed (`generatedAt` wrapped in quotes) for conditional GET. */
  ifNoneMatch?: string;
};

export async function getHomeFeed(options?: GetHomeFeedOptions): Promise<HomeFeed | undefined> {
  const response = await apiClient.get<HomeFeed>('/home', {
    headers: options?.ifNoneMatch ? { 'If-None-Match': options.ifNoneMatch } : undefined,
    validateStatus: (status) => status === 200 || status === 304,
  });

  if (response.status === 304) {
    return undefined;
  }

  return response.data;
}

export async function refreshHomeFeed(): Promise<HomeFeed> {
  const { data } = await apiClient.post<HomeFeed>('/home/refresh');
  return data;
}
