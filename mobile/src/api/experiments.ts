import { apiClient } from './client';

export type ExperimentKey = 'onboarding_variant' | 'paywall_copy' | 'home_layout';

export type ExperimentAssignments = Record<ExperimentKey, string>;

export type OnboardingExperimentPayload = {
  title: string;
  subtitle: string;
  eyebrow: string;
  hint: string;
};

export type PaywallExperimentPayload = {
  heroTitle: string;
  heroSub: string;
  benefitsTitle: string;
  benefits: string[];
  trialCta: string;
  subscribeCta: string;
};

export type HomeLayoutExperimentPayload = {
  sectionOrder: string[];
  compactHero: boolean;
};

export type ExperimentPayloads = {
  onboarding_variant: OnboardingExperimentPayload;
  paywall_copy: PaywallExperimentPayload;
  home_layout: HomeLayoutExperimentPayload;
};

export type ExperimentsResponse = {
  installId: string | null;
  assignments: ExperimentAssignments;
  payloads: ExperimentPayloads;
  isDefault?: boolean;
};

export type ExperimentEventName =
  | 'assignment'
  | 'signup_complete'
  | 'onboarding_complete'
  | 'first_test'
  | 'trial_start'
  | 'paywall_view';

export async function fetchExperiments(installId: string): Promise<ExperimentsResponse> {
  const { data } = await apiClient.get<ExperimentsResponse>('/experiments', {
    params: { installId },
  });
  return data;
}

export async function trackExperimentEvent(input: {
  installId: string;
  event: ExperimentEventName;
  metadata?: Record<string, unknown>;
}): Promise<{ logged: boolean }> {
  const { data } = await apiClient.post<{ logged: boolean }>('/experiments/events', input);
  return data;
}
