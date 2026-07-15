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

function normalizeTransaction(row: Partial<AdminTransaction> | null | undefined): AdminTransaction {
  const student = row?.student ?? { id: null, name: '', email: null };
  return {
    id: row?.id ?? '',
    student: {
      id: student.id ?? null,
      name: student.name ?? row?.studentName ?? 'Unknown student',
      email: student.email ?? row?.studentEmail ?? null,
    },
    studentName: row?.studentName ?? student.name ?? 'Unknown student',
    studentEmail: row?.studentEmail ?? student.email ?? null,
    plan: row?.plan === 'yearly' ? 'yearly' : 'monthly',
    amountPaise: row?.amountPaise ?? 0,
    originalAmountPaise: row?.originalAmountPaise ?? null,
    discountPaise: row?.discountPaise ?? 0,
    couponCode: row?.couponCode ?? null,
    currency: row?.currency ?? 'INR',
    status: row?.status ?? 'created',
    paymentId: row?.paymentId ?? null,
    orderId: row?.orderId ?? '',
    receipt: row?.receipt ?? '',
    canRefund: Boolean(row?.canRefund),
    canRemind: Boolean(row?.canRemind),
    createdAt: row?.createdAt ?? '',
    updatedAt: row?.updatedAt ?? '',
  };
}

export async function fetchRevenueSummary() {
  const data = await apiRequest<Partial<RevenueSummary> | null>('/api/admin/revenue');
  return {
    ...data,
    mrr: data?.mrr ?? data?.mrrPaise ?? 0,
    activeSubs: data?.activeSubs ?? data?.activeSubscriptions ?? 0,
    arpu: data?.arpu ?? data?.arpuPaise ?? 0,
    refunds30d: data?.refunds30d ?? 0,
  };
}

export async function listAdminTransactions(limit = 25, offset = 0) {
  const data = await apiRequest<AdminTransactionsResponse | null>(
    `/api/admin/transactions?limit=${limit}&offset=${offset}`
  );
  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    items: items.map(normalizeTransaction),
    pagination: {
      total: data?.pagination?.total ?? items.length,
      limit: data?.pagination?.limit ?? limit,
      offset: data?.pagination?.offset ?? offset,
      hasMore: Boolean(data?.pagination?.hasMore),
    },
  };
}

export async function refundAdminTransaction(id: string) {
  return apiRequest<{ refunded: boolean; refundId: string; transaction: AdminTransaction }>(
    `/api/admin/transactions/${id}/refund`,
    { method: 'POST', body: JSON.stringify({}) }
  );
}

export async function remindAdminTransaction(id: string) {
  return apiRequest<{ reminded: boolean; transactionId: string; studentName: string }>(
    `/api/admin/transactions/${id}/remind`,
    { method: 'POST', body: JSON.stringify({}) }
  );
}
