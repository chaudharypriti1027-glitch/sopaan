import { apiClient } from './client';

export type SuccessStory = {
  id: string;
  name: string;
  exam: string;
  rank: string;
  quote: string;
  imageColor?: string;
};

export async function listSuccessStories(): Promise<{ items: SuccessStory[] }> {
  const { data } = await apiClient.get<{ items: SuccessStory[] }>('/success-stories');
  return data;
}
