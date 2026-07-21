import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { appVersionInfo } from './appVersion';

/** Deployed API origin (no trailing slash, no `/api` suffix). */
const DEFAULT_API_ORIGIN = 'http://13.220.184.130:4000';

type ExpoExtra = {
  apiUrl?: string;
};

/**
 * Normalizes any user/env value into a bare API origin.
 * Accepts both `http://host:4000` and `http://host:4000/api`.
 */
export function normalizeApiOrigin(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');

  // Common misconfig: EXPO_PUBLIC_API_URL includes `/api`
  if (url.toLowerCase().endsWith('/api')) {
    url = url.slice(0, -4).replace(/\/+$/, '');
  }

  return url;
}

/**
 * Resolves the Sopaan API origin for the current runtime.
 *
 * Priority:
 * 1. EXPO_PUBLIC_API_URL (full origin, e.g. http://13.220.184.130:4000)
 * 2. app.config.js `extra.apiUrl` (baked into the Expo manifest)
 * 3. DEFAULT_API_ORIGIN
 */
function normalizeLocalhostForDevice(url: string): string {
  const isLocal =
    url.includes('://localhost') ||
    url.includes('://127.0.0.1');

  if (!isLocal) {
    return url;
  }

  if (Platform.OS === 'android' && !Constants.isDevice) {
    return url.replace(/localhost|127\.0\.0\.1/g, '10.0.2.2');
  }

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return url.replace(/localhost|127\.0\.0\.1/g, host);
  }

  return url;
}

function readExtraApiUrl(): string | undefined {
  const extra = (Constants.expoConfig?.extra ?? Constants.manifest2?.extra) as ExpoExtra | undefined;
  const value = extra?.apiUrl?.trim();
  return value || undefined;
}

function resolveApiOrigin(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const extraUrl = readExtraApiUrl();
  const raw = envUrl || extraUrl || DEFAULT_API_ORIGIN;
  const origin = normalizeApiOrigin(raw);

  return normalizeLocalhostForDevice(origin);
}

const apiOrigin = resolveApiOrigin();
const apiBaseUrl = `${apiOrigin}/api`;

if (__DEV__) {
  // Helps confirm which host the bundle is actually using after Metro reloads.
  // eslint-disable-next-line no-console
  console.log(`[sopaan] API base → ${apiBaseUrl}`);
}

export const config = {
  apiOrigin,
  apiBaseUrl,
  e2eSandbox: process.env.EXPO_PUBLIC_E2E_SANDBOX === 'true',
  nativeVersion: appVersionInfo.nativeVersion,
  runtimeVersion: appVersionInfo.runtimeVersion,
  platform: appVersionInfo.platform,
} as const;
