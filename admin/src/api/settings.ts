import { apiRequest } from './client';

export interface PlatformSettings {
  freeAiQuota?: number;
  freeAiTestsPerDay?: number;
  freeAiQualityDoubtsPerDay?: number;
  freeAiEvaluationsPerDay?: number;
  freeMocksPerDay?: number;
  freeShowAds?: boolean;
  freeDetailedAnalytics?: boolean;
  proPriceMonthly?: number;
  proPriceYearly?: number;
  proAiTestsPerDay?: number;
  proAiDoubtsPerDay?: number;
  proAiQualityDoubtsPerDay?: number;
  proAiEvaluationsPerDay?: number;
  proMocksPerDay?: number;
  welcomeMonthEnabled?: boolean;
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

function normalizeSettingsResponse(
  data: PlatformSettingsResponse | null | undefined
): PlatformSettingsResponse {
  return {
    settings: data?.settings ?? {},
    integrations:
      data?.integrations && typeof data.integrations === 'object' ? data.integrations : {},
    updatedAt: data?.updatedAt ?? data?.settings?.updatedAt ?? null,
  };
}

export async function fetchPlatformSettings() {
  const data = await apiRequest<PlatformSettingsResponse | null>('/api/admin/settings');
  return normalizeSettingsResponse(data);
}

export async function updatePlatformSettings(payload: Partial<PlatformSettings>) {
  const data = await apiRequest<PlatformSettingsResponse | null>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return normalizeSettingsResponse(data);
}

export type RevokeWelcomeMonthResponse = {
  success?: boolean;
  revoked?: number;
  orphanUsersCleared?: number;
  welcomeMonthEnabled?: boolean;
  message?: string;
};

/** Revoke active free/welcome trial Pro for all students (paid plans untouched). */
export function revokeWelcomeMonthForAll() {
  return apiRequest<RevokeWelcomeMonthResponse>('/api/admin/settings/welcome-month/revoke', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
