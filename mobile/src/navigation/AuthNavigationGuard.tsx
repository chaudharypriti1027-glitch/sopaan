import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import { goToLogin } from './goToLogin';
import { navigationRef } from './navigationRef';

/** After sign-out, leave the student app stack and return to Login. */
export function AuthNavigationGuard() {
  const status = useAuthStore((state) => state.status);
  const previousStatus = useRef(status);

  useEffect(() => {
    const signedOut = previousStatus.current === 'authed' && status === 'guest';

    if (signedOut && navigationRef.isReady()) {
      const state = navigationRef.getRootState();
      const rootRoute = state?.routes[state.index ?? 0]?.name;
      if (rootRoute === 'Main') {
        goToLogin();
      }
    }

    previousStatus.current = status;
  }, [status]);

  return null;
}
