import { deleteSecureItem, getSecureItem, setSecureItem } from './secureStorage';

const TOKEN_KEY = 'sopaan_access_token';
const REFRESH_TOKEN_KEY = 'sopaan_refresh_token';

export type StoredTokens = {
  token: string;
  refreshToken: string;
};

let memoryTokens: StoredTokens | null = null;

/** Persist access + refresh tokens in encrypted SecureStore only. */
export async function saveTokens({ token, refreshToken }: StoredTokens): Promise<void> {
  memoryTokens = { token, refreshToken };
  await Promise.all([
    setSecureItem(TOKEN_KEY, token),
    setSecureItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function getTokens(): Promise<StoredTokens | null> {
  if (memoryTokens?.token && memoryTokens.refreshToken) {
    return memoryTokens;
  }

  const [token, refreshToken] = await Promise.all([
    getSecureItem(TOKEN_KEY),
    getSecureItem(REFRESH_TOKEN_KEY),
  ]);

  if (!token || !refreshToken) {
    memoryTokens = null;
    return null;
  }

  memoryTokens = { token, refreshToken };
  return memoryTokens;
}

export async function clearTokens(): Promise<void> {
  memoryTokens = null;
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
  if (memoryTokens?.token) {
    return memoryTokens.token;
  }

  const tokens = await getTokens();
  return tokens?.token ?? null;
}

export async function hasStoredSession(): Promise<boolean> {
  const tokens = await getTokens();
  return Boolean(tokens?.refreshToken);
}
