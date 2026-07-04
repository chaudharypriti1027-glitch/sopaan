import { deleteSecureItem, getSecureItem, setSecureItem } from './secureStorage';

const TOKEN_KEY = 'sopaan_access_token';
const REFRESH_TOKEN_KEY = 'sopaan_refresh_token';

export type StoredTokens = {
  token: string;
  refreshToken: string;
};

/** Persist access + refresh tokens in encrypted SecureStore only. */
export async function saveTokens({ token, refreshToken }: StoredTokens): Promise<void> {
  await Promise.all([
    setSecureItem(TOKEN_KEY, token),
    setSecureItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function getTokens(): Promise<StoredTokens | null> {
  const [token, refreshToken] = await Promise.all([
    getSecureItem(TOKEN_KEY),
    getSecureItem(REFRESH_TOKEN_KEY),
  ]);

  if (!token || !refreshToken) {
    return null;
  }

  return { token, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    deleteSecureItem(TOKEN_KEY),
    deleteSecureItem(REFRESH_TOKEN_KEY),
  ]);
}

export async function getRefreshToken(): Promise<string | null> {
  const tokens = await getTokens();
  return tokens?.refreshToken ?? null;
}

/** Access token for axios / socket auth helpers. */
export async function getAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  return tokens?.token ?? null;
}

export async function hasStoredSession(): Promise<boolean> {
  const tokens = await getTokens();
  return Boolean(tokens?.refreshToken);
}
