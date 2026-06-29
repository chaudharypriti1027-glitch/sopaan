import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { authApi } from '../api';
import type { SignupInput } from '../api/auth';
import { getGoogleClientIds } from '../config/googleAuth';
import {
  clearReferralAttribution,
  consumeReferralAttribution,
} from '../referrals/referralStorage';

WebBrowser.maybeCompleteAuthSession();

type GoogleSignInOptions = {
  privacyConsent?: SignupInput['privacyConsent'];
};

export function useGoogleSignIn() {
  const clientIds = getGoogleClientIds();
  const [loading, setLoading] = useState(false);

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: clientIds.web,
    iosClientId: clientIds.ios,
    androidClientId: clientIds.android,
  });

  const signInWithGoogle = useCallback(
    async (options?: GoogleSignInOptions) => {
      if (!clientIds.web) {
        throw new Error('Google sign-in is not configured in this build.');
      }

      if (!request) {
        throw new Error('Google sign-in is not ready yet. Please try again.');
      }

      setLoading(true);
      try {
        const result = await promptAsync();

        if (result.type === 'cancel' || result.type === 'dismiss') {
          throw new Error('Google sign-in was cancelled.');
        }

        if (result.type !== 'success') {
          throw new Error('Google sign-in failed. Please try again.');
        }

        const idToken = result.params.id_token;
        if (!idToken) {
          throw new Error(
            'Google did not return a sign-in token. Allow email access and try again.',
          );
        }

        const attribution = await consumeReferralAttribution();
        const authResult = await authApi.loginWithGoogle({
          idToken,
          ...attribution,
          privacyConsent: options?.privacyConsent,
        });
        await clearReferralAttribution();
        return authResult;
      } finally {
        setLoading(false);
      }
    },
    [clientIds.web, promptAsync, request],
  );

  return {
    signInWithGoogle,
    loading,
    isConfigured: Boolean(clientIds.web && request),
  };
}
