import type { SignupInput } from '../api/auth';
import { parseApiError } from '../api';
import type { AuthResult } from '../types/auth';
import { routeAfterAuthResult } from './routeAfterSession';
import { completeStudentLogin, isAdminAppAccessError } from './studentSession';

type GoogleSignInFn = (options?: {
  privacyConsent?: SignupInput['privacyConsent'];
}) => Promise<AuthResult>;

type GoogleLoginNavigation = Parameters<typeof routeAfterAuthResult>[0] & {
  navigate: (name: string) => void;
};

type CompleteGoogleLoginOptions = {
  privacyConsent?: SignupInput['privacyConsent'];
  onError: (message: string) => void;
};

function isUserCancelled(message: string) {
  return /cancel/i.test(message);
}

/** Run Google OAuth, persist session, and route new vs returning users. */
export async function completeGoogleLogin(
  navigation: GoogleLoginNavigation,
  signInWithGoogle: GoogleSignInFn,
  options: CompleteGoogleLoginOptions,
): Promise<boolean> {
  try {
    const result = await signInWithGoogle({ privacyConsent: options.privacyConsent });
    const ok = await completeStudentLogin(navigation, result, {
      afterSession: (session) => routeAfterAuthResult(navigation, session),
    });
    return ok;
  } catch (error) {
    if (isAdminAppAccessError(error)) {
      options.onError('This is an admin account. Use the web admin console.');
      return false;
    }

    const message =
      error instanceof Error ? error.message : parseApiError(error).message;

    if (isUserCancelled(message)) {
      return false;
    }

    options.onError(message);
    return false;
  }
}
