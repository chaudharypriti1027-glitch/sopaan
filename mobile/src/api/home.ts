import { apiClient } from './client';
import type { HomeFeed } from '../types/home';

export async function getHomeFeed(): Promise<HomeFeed> {
  const { data } = await apiClient.get<HomeFeed>('/home');
  return data;
}

export async function refreshHomeFeed(): Promise<HomeFeed> {
  const { data } = await apiClient.post<HomeFeed>('/home/refresh');
  return data;
}
