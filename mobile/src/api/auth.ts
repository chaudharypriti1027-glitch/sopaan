import { apiClient } from './client';
import type { AuthResult } from '../types/auth';
import type { AuthSession, RefreshResponse } from './types';

export type SignupInput = {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  referralCode?: string;
  installId?: string;
  privacyConsent: {
    policyVersion: string;
    aiProcessing: true;
    marketing?: boolean;
  };
};

export type LoginInput = {
  phone?: string;
  email?: string;
  password: string;
};

export type OtpRequestInput = {
  phone: string;
};

export type OtpVerifyInput = {
  phone: string;
  code: string;
  referralCode?: string;
  installId?: string;
  privacyConsent?: {
    policyVersion: string;
    aiProcessing: true;
    marketing?: boolean;
  };
};

export type GoogleAuthInput = {
  idToken: string;
  referralCode?: string;
  installId?: string;
  privacyConsent?: SignupInput['privacyConsent'];
};

export async function signup(input: SignupInput): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>('/auth/signup', input);
  return data;
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>('/auth/login', input);
  return data;
}

export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  const { data } = await apiClient.post<RefreshResponse>('/auth/refresh', { refreshToken });
  return data;
}

export async function logout(refreshToken?: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/logout', {
    refreshToken,
  });
  return data;
}

export async function requestOtp(input: OtpRequestInput): Promise<{ sent: true }> {
  const { data } = await apiClient.post<{ sent: true }>('/auth/request-otp', input);
  return data;
}

export async function verifyOtp(input: OtpVerifyInput): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>('/auth/verify-otp', input);
  return data;
}

export async function loginWithGoogle(input: GoogleAuthInput): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>('/auth/google', input);
  return data;
}

/** @deprecated use requestOtp */
export async function requestOtpLegacy(input: OtpRequestInput): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/otp/request', input);
  return data;
}

/** @deprecated use verifyOtp */
export async function verifyOtpLegacy(input: OtpVerifyInput): Promise<AuthSession> {
  const { data } = await apiClient.post<AuthSession>('/auth/otp/verify', input);
  return data;
}
