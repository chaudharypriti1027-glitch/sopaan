import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { trackDeferredClick } from '../api/referrals';
import {
  getOrCreateInstallId,
  parseReferralCodeFromUrl,
  savePendingReferralCode,
} from '../referrals/referralStorage';

async function handleReferralUrl(url: string | null) {
  if (!url) {
    return;
  }

  const code = parseReferralCodeFromUrl(url);
  if (!code) {
    return;
  }

  await savePendingReferralCode(code);

  const installId = await getOrCreateInstallId();
  try {
    await trackDeferredClick({ code, installId });
  } catch {
    // offline or server unavailable — local storage still preserves the code
  }
}

export function useReferralDeepLink() {
  useEffect(() => {
    void Linking.getInitialURL().then((url) => handleReferralUrl(url));

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleReferralUrl(url);
    });

    return () => subscription.remove();
  }, []);
}

export { bootstrapReferralInstallTracking } from '../referrals/referralStorage';
