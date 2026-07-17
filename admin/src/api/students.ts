import { apiRequest } from './client';
import { getAccessToken } from './storage';
import { getApiOrigin } from '../realtime/socketOrigin';
import type { PaginatedResponse } from './contentTypes';
import { normalizeDoc, normalizeList } from './normalize';

export type StudentAccountStatus = 'active' | 'suspended';
export type StudentPremiumFilter = 'pro' | 'free' | 'trial';
export type StudentPremiumSource = 'none' | 'trial' | 'paid' | 'admin' | 'unknown';

export interface AdminStudent {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  targetExam: string | null;
  examDate?: string | null;
  attempts: number;
  accuracy: number | null;
  streak: number;
  lastActiveAt?: string | null;
  tier: string;
  isPremium: boolean;
  premiumPlan?: string | null;
  premiumExpiresAt?: string | null;
  premiumTrialUsed?: boolean;
  premiumSource?: StudentPremiumSource;
  leagueTier?: string | null;
  accountStatus: StudentAccountStatus;
  joinedAt: string;
}

export interface StudentAttempt {
  id: string;
  testTitle: string;
  subject: string | null;
  examTag: string | null;
  testType?: string | null;
  score: number | null;
  accuracy: number | null;
  totalTimeSec: number | null;
  createdAt: string;
}

export interface StudentGoal {
  id: string;
  examId: string | null;
  examName: string;
  examDate: string | null;
  targetRank: number | null;
  createdAt: string | null;
}

export interface StudentPremium {
  isPremium: boolean;
  plan: string | null;
  expiresAt: string | null;
  trialUsed: boolean;
  source: StudentPremiumSource;
  cancelled: boolean;
  status: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
}

export interface StudentEntitlement {
  plan: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  hasAccess: boolean;
  autoRenews: boolean;
  provider: string | null;
}

export interface StudentPayment {
  id: string;
  plan: string;
  amountPaise: number;
  currency: string;
  status: string;
  createdAt: string | null;
}

export interface AdminStudentDetail extends AdminStudent {
  language: string | null;
  educationLevel: string | null;
  state: string | null;
  category: string | null;
  onboardingComplete: boolean;
  coins: number;
  level: number;
  xp: number;
  premium: StudentPremium;
  entitlement: StudentEntitlement | null;
  goals: StudentGoal[];
  payments: StudentPayment[];
  lastAttemptAt: string | null;
  attemptHistory: StudentAttempt[];
}

export interface StudentListParams {
  q?: string;
  premium?: StudentPremiumFilter;
  exam?: string;
  status?: StudentAccountStatus;
  limit?: number;
  offset?: number;
}

function toQuery(params: StudentListParams) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.premium) search.set('premium', params.premium);
  if (params.exam) search.set('exam', params.exam);
  if (params.status) search.set('status', params.status);
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

const EMPTY_PREMIUM: StudentPremium = {
  isPremium: false,
  plan: null,
  expiresAt: null,
  trialUsed: false,
  source: 'none',
  cancelled: false,
  status: 'none',
  cancelAtPeriodEnd: false,
  cancelledAt: null,
};

function normalizeStudentRow(doc: AdminStudent): AdminStudent {
  const row = normalizeDoc(doc);
  return {
    ...row,
    name: row.name?.trim() || 'Unknown',
    email: row.email ?? null,
    phone: row.phone ?? null,
    targetExam: row.targetExam ?? null,
    attempts: row.attempts ?? 0,
    accuracy: row.accuracy ?? null,
    streak: row.streak ?? 0,
    tier: row.tier || 'Free',
    isPremium: Boolean(row.isPremium),
    accountStatus: row.accountStatus === 'suspended' ? 'suspended' : 'active',
    joinedAt: row.joinedAt ?? '',
  };
}

function normalizeStudentDetail(doc: AdminStudentDetail): AdminStudentDetail {
  const row = normalizeStudentRow(doc);
  return {
    ...doc,
    ...row,
    language: doc.language ?? null,
    educationLevel: doc.educationLevel ?? null,
    state: doc.state ?? null,
    category: doc.category ?? null,
    onboardingComplete: Boolean(doc.onboardingComplete),
    coins: doc.coins ?? 0,
    level: doc.level ?? 0,
    xp: doc.xp ?? 0,
    premium: doc.premium
      ? {
          ...EMPTY_PREMIUM,
          ...doc.premium,
          isPremium: Boolean(doc.premium.isPremium),
          trialUsed: Boolean(doc.premium.trialUsed),
          cancelled: Boolean(doc.premium.cancelled),
          cancelAtPeriodEnd: Boolean(doc.premium.cancelAtPeriodEnd),
          source: doc.premium.source ?? 'none',
          status: doc.premium.status ?? 'none',
        }
      : EMPTY_PREMIUM,
    entitlement: doc.entitlement ?? null,
    goals: Array.isArray(doc.goals) ? doc.goals.map(normalizeDoc) : [],
    payments: Array.isArray(doc.payments) ? doc.payments.map(normalizeDoc) : [],
    lastAttemptAt: doc.lastAttemptAt ?? null,
    attemptHistory: Array.isArray(doc.attemptHistory)
      ? doc.attemptHistory.map(normalizeDoc)
      : [],
  };
}

export async function fetchStudents(params: StudentListParams = {}) {
  const data = await apiRequest<PaginatedResponse<AdminStudent>>(
    `/api/admin/students${toQuery(params)}`,
  );
  const list = normalizeList(data);
  return {
    ...list,
    items: list.items.map(normalizeStudentRow),
  };
}

export async function fetchStudent(id: string) {
  const data = await apiRequest<AdminStudentDetail>(`/api/admin/students/${id}`);
  return normalizeStudentDetail(data);
}

export async function setStudentStatus(id: string, status: StudentAccountStatus) {
  const data = await apiRequest<AdminStudent>(`/api/admin/students/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return normalizeStudentRow(data);
}

export type GrantPremiumPlan = 'monthly' | 'yearly' | 'trial';

export async function grantStudentPremium(
  id: string,
  body: { plan: GrantPremiumPlan; days?: number },
) {
  const data = await apiRequest<AdminStudentDetail>(`/api/admin/students/${id}/premium`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return normalizeStudentDetail(data);
}

export async function revokeStudentPremium(id: string) {
  const data = await apiRequest<AdminStudentDetail>(`/api/admin/students/${id}/premium`, {
    method: 'DELETE',
    body: JSON.stringify({}),
  });
  return normalizeStudentDetail(data);
}

export async function downloadStudentsCsv(params: StudentListParams = {}) {
  const token = getAccessToken();
  const qs = toQuery({
    q: params.q,
    premium: params.premium,
    exam: params.exam,
    status: params.status,
  });

  const res = await fetch(`${getApiOrigin()}/api/admin/students/export${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: { message?: string }; message?: string };
      message = body.error?.message ?? body.message ?? message;
    } catch {
      /* empty */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
