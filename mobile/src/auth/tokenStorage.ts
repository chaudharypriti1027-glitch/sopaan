export {
  clearTokens,
  getAccessToken,
  getTokens,
  hasStoredSession,
  saveTokens,
} from '../lib/secure';
export type { StoredTokens } from '../lib/secure';

/** @deprecated use saveTokens({ token, refreshToken }) */
export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  const { saveTokens } = await import('../lib/secure');
  await saveTokens({ token: accessToken, refreshToken });
}

/** @deprecated use saveTokens */
export async function setAccessToken(token: string): Promise<void> {
  const { getTokens, saveTokens } = await import('../lib/secure');
  const existing = await getTokens();

  if (!existing?.refreshToken) {
    throw new Error('Cannot update access token without refresh token');
  }

  await saveTokens({ token, refreshToken: existing.refreshToken });
}

/** @deprecated use getTokens().refreshToken */
export async function getRefreshToken(): Promise<string | null> {
  const { getTokens } = await import('../lib/secure');
  const tokens = await getTokens();
  return tokens?.refreshToken ?? null;
}
