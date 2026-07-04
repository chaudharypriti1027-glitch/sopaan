import { apiRequest } from './client';

export type BannerLinkType =
  | 'premium'
  | 'test_series'
  | 'current_affairs'
  | 'live_classes'
  | 'readiness'
  | 'quiz'
  | 'deeplink';

export type AdminBanner = {
  id: string;
  message: string;
  linkType: BannerLinkType;
  linkRef?: string | null;
  active: boolean;
  deeplink: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminBannersResponse = {
  items: AdminBanner[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type BannerCreateInput = {
  message: string;
  linkType: BannerLinkType;
  linkRef?: string;
};

export async function listAdminBanners(limit = 50) {
  return apiRequest<AdminBannersResponse>(`/api/admin/banners?limit=${limit}`);
}

export async function createAdminBanner(body: BannerCreateInput) {
  return apiRequest<AdminBanner>('/api/admin/banners', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateAdminBanner(id: string, body: Partial<BannerCreateInput>) {
  return apiRequest<AdminBanner>(`/api/admin/banners/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function setAdminBannerActive(id: string, active: boolean) {
  return apiRequest<AdminBanner>(`/api/admin/banners/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}

export async function deleteAdminBanner(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/api/admin/banners/${id}`, {
    method: 'DELETE',
  });
}
