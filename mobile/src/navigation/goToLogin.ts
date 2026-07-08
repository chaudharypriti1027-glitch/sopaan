import { resetToLogin } from '../auth/routeAfterSession';

/** Reset the root navigator to the Login screen when the session ends. */
export function goToLogin() {
  // Lazy require avoids loading navigationRef before the navigation container exists in tests.
  const { navigationRef } =
    require('./navigationRef') as typeof import('./navigationRef');

  if (navigationRef.isReady()) {
    resetToLogin(navigationRef);
  }
}
