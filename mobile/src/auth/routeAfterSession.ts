import { CommonActions } from '@react-navigation/native';
import { isOnboardingComplete } from './onboardingComplete';
import type { AuthResult, Profile } from '../types/auth';

type RootNavigation = {
  dispatch: (action: ReturnType<typeof CommonActions.reset>) => void;
};

/** Navigate to Home or ProfileSetup after a successful auth session. */
export function routeAfterSession(navigation: RootNavigation, profile: Profile | null) {
  if (!profile) {
    return;
  }

  if (isOnboardingComplete(profile)) {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      }),
    );
    return;
  }

  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'Auth',
          state: {
            index: 0,
            routes: [{ name: 'ProfileSetup' }],
          },
        },
      ],
    }),
  );
}

/** OTP verify routing — new users collect name/email before profile setup. */
export function routeAfterAuthResult(navigation: RootNavigation, result: AuthResult) {
  if (result.isNewUser) {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Auth',
            state: {
              index: 0,
              routes: [{ name: 'Signup' }],
            },
          },
        ],
      }),
    );
    return;
  }

  if (!isOnboardingComplete(result.profile)) {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Auth',
            state: {
              index: 0,
              routes: [{ name: 'ProfileSetup' }],
            },
          },
        ],
      }),
    );
    return;
  }

  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    }),
  );
}

/** Clear session stack and land on Login. */
export function resetToLogin(navigation: RootNavigation) {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'Auth',
          state: {
            index: 0,
            routes: [{ name: 'Login' }],
          },
        },
      ],
    }),
  );
}
