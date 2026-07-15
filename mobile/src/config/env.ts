import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { appVersionInfo } from './appVersion';

const DEFAULT_API_ORIGIN = 'https://sopaan.onrender.com';

/**
 * Resolves the Sopaan API origin for the current runtime.
 *
 * Priority:
 * 1. EXPO_PUBLIC_API_URL (full origin, e.g. http://192.168.1.10:4000)
 * 2. Deployed Render API (used by local Expo/device checks too)
 *
 * To use a local API, explicitly set EXPO_PUBLIC_API_URL.
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

function resolveApiOrigin(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return normalizeLocalhostForDevice(envUrl.replace(/\/$/, ''));
  }

  return DEFAULT_API_ORIGIN;
}

const apiOrigin = resolveApiOrigin();

export const config = {
  apiOrigin,
  apiBaseUrl: `${apiOrigin}/api`,
  e2eSandbox: process.env.EXPO_PUBLIC_E2E_SANDBOX === 'true',
  nativeVersion: appVersionInfo.nativeVersion,
  runtimeVersion: appVersionInfo.runtimeVersion,
  platform: appVersionInfo.platform,
} as const;
