import type { NavigationProp } from '@react-navigation/native';
import {
  AdminAppAccessError,
  isAdminAppAccessError,
  openAdminConsole,
} from './adminPortal';
import type { AuthResult } from '../types/auth';
import { normalizeAuthResult } from './normalizeAuthResult';
import { routeAfterSession } from './routeAfterSession';
import { useAuthStore } from '../store/auth';

type AuthNavigation = {
  navigate: (name: string) => void;
  dispatch?: NavigationProp<Record<string, unknown>>['dispatch'];
};

type CompleteStudentLoginOptions = {
  afterSession?: (result: AuthResult) => void;
};

/** Persist a student session or redirect admins to the web console. */
export async function completeStudentLogin(
  navigation: AuthNavigation,
  raw: AuthResult | Parameters<typeof normalizeAuthResult>[0],
  options?: CompleteStudentLoginOptions,
): Promise<boolean> {
  try {
    const result = normalizeAuthResult(raw);
    await useAuthStore.getState().setSession(result);
    if (options?.afterSession) {
      options.afterSession(result);
    } else {
      routeAfterSession(
        navigation as Parameters<typeof routeAfterSession>[0],
        useAuthStore.getState().profile,
      );
    }
    return true;
  } catch (error) {
    if (isAdminAppAccessError(error)) {
      openAdminConsole(error.adminConsoleUrl);
      navigation.navigate('AdminPortal');
      return false;
    }
    throw error;
  }
}

export { AdminAppAccessError, isAdminAppAccessError };
