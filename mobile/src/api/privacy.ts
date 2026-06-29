import { apiClient } from './client';

export type PrivacyConsentInput = {
  policyVersion: string;
  aiProcessing: true;
  marketing?: boolean;
};

export type PrivacyPolicy = {
  version: string;
  updatedAt: string;
  url: string;
  termsUrl: string;
  jurisdiction: string;
  framework: string;
  disclaimer: string;
  sections: {
    id: string;
    title: string;
    body?: string;
    items?: unknown;
    processors?: unknown;
  }[];
  consentRequirements: {
    privacyPolicy: boolean;
    aiProcessing: boolean;
    marketing: boolean;
  };
};

export type ConsentStatus = {
  consent: PrivacyConsentInput & { acceptedAt?: string };
  currentPolicyVersion: string;
  policyUrl: string;
};

export type DeletionRequestResponse = {
  deletionToken: string;
  expiresAt: string;
  confirmPhrase: string;
  message: string;
};

export async function getPolicy(): Promise<PrivacyPolicy> {
  const { data } = await apiClient.get<PrivacyPolicy>('/privacy/policy');
  return data;
}

export async function getConsentStatus(): Promise<ConsentStatus> {
  const { data } = await apiClient.get<ConsentStatus>('/privacy/consent');
  return data;
}

export async function updateMarketingConsent(marketing: boolean): Promise<{ consent: ConsentStatus['consent'] }> {
  const { data } = await apiClient.patch<{ consent: ConsentStatus['consent'] }>('/privacy/consent', {
    marketing,
  });
  return data;
}

export async function exportUserData(): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get<Record<string, unknown>>('/privacy/export');
  return data;
}

export async function requestAccountDeletion(input: {
  password?: string;
  otpCode?: string;
}): Promise<DeletionRequestResponse> {
  const { data } = await apiClient.post<DeletionRequestResponse>('/privacy/deletion/request', input);
  return data;
}

export async function confirmAccountDeletion(input: {
  deletionToken: string;
  confirmPhrase: string;
  refreshToken?: string;
}): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/privacy/deletion/confirm', input);
  return data;
}
