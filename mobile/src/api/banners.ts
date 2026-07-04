import { apiClient } from './client';

export type HomeBanner = {
  id: string;
  message: string;
  linkType: string;
  linkRef?: string | null;
  deeplink: string;
};

export type HomeBannerResponse = {
  banner: HomeBanner | null;
};

export async function getActiveBanner(): Promise<HomeBannerResponse> {
  const { data } = await apiClient.get<HomeBannerResponse>('/banners');
  return data;
}
