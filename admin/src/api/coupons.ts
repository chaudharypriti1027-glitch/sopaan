import { apiRequest } from './client';

export type CouponType = 'percent' | 'flat';

export type AdminCoupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  usageLimit: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCouponsResponse = {
  items: AdminCoupon[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type CouponCreateInput = {
  code: string;
  type: CouponType;
  value: number;
  usageLimit: number;
  expiresAt: string;
};

export async function listAdminCoupons(limit = 50) {
  return apiRequest<AdminCouponsResponse>(`/api/admin/coupons?limit=${limit}`);
}

export async function createAdminCoupon(body: CouponCreateInput) {
  return apiRequest<AdminCoupon>('/api/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateAdminCoupon(id: string, body: Partial<Omit<CouponCreateInput, 'code'>>) {
  return apiRequest<AdminCoupon>(`/api/admin/coupons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function setAdminCouponActive(id: string, active: boolean) {
  return apiRequest<AdminCoupon>(`/api/admin/coupons/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}

export async function deleteAdminCoupon(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/api/admin/coupons/${id}`, {
    method: 'DELETE',
  });
}
