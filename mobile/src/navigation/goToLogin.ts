import { resetToLogin } from '../auth/routeAfterSession';

/** Reset the root navigator to the Login screen when the session ends. */
export function goToLogin() {
  const { navigationRef } =
    require('./navigationRef') as typeof import('./navigationRef');

  if (navigationRef.isReady()) {
    resetToLogin(navigationRef);
  }
}
