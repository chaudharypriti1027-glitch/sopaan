import type { Profile } from '../types/auth';

export const DEFAULT_PLACEHOLDER_NAME = 'Student';

/** OTP-created accounts land on Signup to collect a real name (and optional email). */
export function needsPostOtpProfileCompletion(profile: Profile | null): boolean {
  if (!profile?.phone?.trim()) {
    return false;
  }

  const name = profile.name?.trim() ?? '';
  return !name || name === DEFAULT_PLACEHOLDER_NAME;
}
