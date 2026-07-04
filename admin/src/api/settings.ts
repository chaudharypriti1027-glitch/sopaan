import { apiRequest } from './client';

export interface PlatformSettings {
  freeAiQuota: number;
  freeAiTestsPerDay: number;
  freeAiQualityDoubtsPerDay: number;
  freeAiEvaluationsPerDay: number;
  freeMocksPerDay: number;
  freeShowAds: boolean;
  freeDetailedAnalytics: boolean;
  proPriceMonthly: number;
  proPriceYearly: number;
  proAiTestsPerDay: number;
  proAiDoubtsPerDay: number;
  proAiQualityDoubtsPerDay: number;
  proAiEvaluationsPerDay: number;
  proMocksPerDay: number;
  updatedAt?: string | null;
}

export interface IntegrationStatus {
  configured: boolean;
  masked?: string | null;
  keyIdMasked?: string | null;
  editable: boolean;
  source: 'env';
}

export interface PlatformSettingsResponse {
  settings: PlatformSettings;
  integrations: Record<string, IntegrationStatus & Record<string, unknown>>;
  updatedAt?: string | null;
}

export function fetchPlatformSettings() {
  return apiRequest<PlatformSettingsResponse>('/api/admin/settings');
}

export function updatePlatformSettings(payload: Partial<PlatformSettings>) {
  return apiRequest<PlatformSettingsResponse>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
