import { apiRequest } from './client';

export type RevenueSummary = {
  mrr: number;
  activeSubs: number;
  arpu: number;
  refunds30d: number;
  mrrPaise?: number;
  revenue30dPaise?: number;
  activeSubscriptions?: number;
  arpuPaise?: number;
  proStudents?: number;
};

export type AdminTransaction = {
  id: string;
  student: {
    id: string | null;
    name: string;
    email: string | null;
  };
  studentName: string;
  studentEmail: string | null;
  plan: 'monthly' | 'yearly';
  amountPaise: number;
  originalAmountPaise: number | null;
  discountPaise: number;
  couponCode: string | null;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  paymentId: string | null;
  orderId: string;
  receipt: string;
  canRefund: boolean;
  canRemind: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminTransactionsResponse = {
  items: AdminTransaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export async function fetchRevenueSummary() {
  return apiRequest<RevenueSummary>('/api/admin/revenue');
}

export async function listAdminTransactions(limit = 25, offset = 0) {
  return apiRequest<AdminTransactionsResponse>(
    `/api/admin/transactions?limit=${limit}&offset=${offset}`,
  );
}

export async function refundAdminTransaction(id: string) {
  return apiRequest<{ refunded: boolean; refundId: string; transaction: AdminTransaction }>(
    `/api/admin/transactions/${id}/refund`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}

export async function remindAdminTransaction(id: string) {
  return apiRequest<{ reminded: boolean; transactionId: string; studentName: string }>(
    `/api/admin/transactions/${id}/remind`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}
