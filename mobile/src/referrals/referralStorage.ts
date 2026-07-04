import { deleteSecureItem, getSecureItem, setSecureItem } from '../lib/secureStorage';

const REFERRAL_CODE_KEY = 'sopaan_pending_referral_code';
const INSTALL_ID_KEY = 'sopaan_install_id';

function createInstallId() {
  return `inst_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export async function getOrCreateInstallId(): Promise<string> {
  const existing = await getSecureItem(INSTALL_ID_KEY);
  if (existing) {
    return existing;
  }

  const installId = createInstallId();
  await setSecureItem(INSTALL_ID_KEY, installId);
  return installId;
}

export async function savePendingReferralCode(code: string): Promise<void> {
  await setSecureItem(REFERRAL_CODE_KEY, code.trim().toUpperCase());
}

export async function getPendingReferralCode(): Promise<string | null> {
  return getSecureItem(REFERRAL_CODE_KEY);
}

export async function clearPendingReferralCode(): Promise<void> {
  await deleteSecureItem(REFERRAL_CODE_KEY);
}

export function parseReferralCodeFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const queryCode = parsed.searchParams.get('code');

    if (queryCode) {
      return queryCode.trim().toUpperCase();
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    const referIndex = segments.findIndex((segment) => segment.toLowerCase() === 'refer');
    const pathCode = referIndex >= 0 ? segments[referIndex + 1] : segments[segments.length - 1];

    if (!pathCode || pathCode.toLowerCase() === 'refer') {
      return null;
    }

    return pathCode.startsWith('SOPAAN-') ? pathCode.toUpperCase() : `SOPAAN-${pathCode.toUpperCase()}`;
  } catch {
    return null;
  }
}

export async function consumeReferralAttribution(): Promise<{
  referralCode?: string;
  installId: string;
}> {
  const installId = await getOrCreateInstallId();
  const referralCode = (await getPendingReferralCode()) ?? undefined;

  return { referralCode, installId };
}

export async function clearReferralAttribution(): Promise<void> {
  await clearPendingReferralCode();
}

export async function bootstrapReferralInstallTracking(): Promise<string> {
  return getOrCreateInstallId();
}
