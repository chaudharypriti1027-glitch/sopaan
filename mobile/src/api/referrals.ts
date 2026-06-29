import { apiClient } from './client';

export type ReferralRewards = {
  referrerCoins: number;
  refereeCoins: number;
  referrerTrialDays: number;
  refereeTrialDays: number;
};

export type ReferralListItem = {
  id: string;
  status: 'pending' | 'onboarding_complete' | 'rewarded' | 'rejected';
  code: string;
  refereeName: string;
  refereeJoinedAt: string;
  onboardingCompletedAt?: string | null;
  firstTestCompletedAt?: string | null;
  rewardedAt?: string | null;
  referrerReward?: { coins?: number; trialDays?: number };
  rejectionReason?: string | null;
  createdAt: string;
};

export type ReferralDashboard = {
  code: string;
  appLink: string;
  webLink: string;
  shareText: string;
  stats: {
    invited: number;
    pending: number;
    rewarded: number;
    rejected: number;
    coinsEarned: number;
  };
  referrals: ReferralListItem[];
  rewards: ReferralRewards;
};

export async function getMyReferrals(): Promise<ReferralDashboard> {
  const { data } = await apiClient.get<ReferralDashboard>('/referrals/me');
  return data;
}

export async function validateReferralCode(code: string): Promise<{
  valid: boolean;
  reason?: string;
  code?: string;
  referrerName?: string;
}> {
  const { data } = await apiClient.post('/referrals/validate', { code });
  return data;
}

export async function trackDeferredClick(input: {
  code: string;
  installId: string;
}): Promise<{ tracked: boolean; reason?: string; code?: string }> {
  const { data } = await apiClient.post('/referrals/track-click', input);
  return data;
}

export async function claimDeferredReferral(installId: string): Promise<{
  applied: boolean;
  reason?: string;
  referrerName?: string;
}> {
  const { data } = await apiClient.post('/referrals/claim', { installId });
  return data;
}

export async function confirmReferralOnboarding(): Promise<{ updated: boolean }> {
  const { data } = await apiClient.post<{ updated: boolean }>('/referrals/onboarding-complete');
  return data;
}
