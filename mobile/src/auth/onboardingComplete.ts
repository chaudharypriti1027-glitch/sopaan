import type { Profile } from '../types/auth';

/** Whether the user finished profile setup (server flag or core fields present). */
export function isOnboardingComplete(profile: Profile): boolean {
  if (profile.onboardingComplete != null) {
    return profile.onboardingComplete;
  }

  return Boolean(
    profile.name?.trim() && profile.state?.trim() && profile.targetExam?.trim(),
  );
}
