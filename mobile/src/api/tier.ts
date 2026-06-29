import { apiClient } from './client';

export type TierFeatureKey =
  | 'ai_generate_test'
  | 'ai_doubt'
  | 'ai_evaluate'
  | 'mock_submit'
  | 'detailed_analytics';

export type TierLimits = {
  aiGenerateTestsPerDay: number;
  aiDoubtsFastPerDay: number;
  aiDoubtsQualityPerDay: number;
  aiEvaluationsPerDay: number;
  mocksPerDay: number;
};

export type TierFeatureConfig = {
  type: 'quota' | 'pro_only';
  limit: number | null;
  title: string;
  message: string;
};

export type TierUsageSnapshot = {
  dateKey: string;
  aiGenerateTests: number;
  mocksSubmitted: number;
  aiDoubtsFast: number;
  aiDoubtsQuality: number;
  limits: TierLimits;
  remaining: {
    aiGenerateTests: number;
    mocksSubmitted: number;
    aiDoubtsFast: number;
    aiDoubtsQuality: number;
  };
};

export type TierStatusResponse = {
  isPro: boolean;
  showAds: boolean;
  detailedAnalytics: boolean;
  limits: TierLimits;
  features: Record<TierFeatureKey, TierFeatureConfig>;
  usage: TierUsageSnapshot | null;
};

export async function getTierStatus(): Promise<TierStatusResponse> {
  const { data } = await apiClient.get<TierStatusResponse>('/tier/status');
  return data;
}
