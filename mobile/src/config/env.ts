import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { appVersionInfo } from './appVersion';

const DEFAULT_PORT = 4000;

/**
 * Resolves the Sopaan API origin for the current runtime.
 *
 * Priority:
 * 1. EXPO_PUBLIC_API_URL (full origin, e.g. http://192.168.1.10:4000)
 * 2. Android emulator → 10.0.2.2
 * 3. Expo dev host (physical device / simulator via Metro) → host:4000
 * 4. iOS simulator fallback → localhost
 */
function resolveApiOrigin(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  if (Platform.OS === 'android' && !Constants.isDevice) {
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${DEFAULT_PORT}`;
  }

  if (Platform.OS === 'ios' || Platform.OS === 'web') {
    return `http://localhost:${DEFAULT_PORT}`;
  }

  return `http://10.0.2.2:${DEFAULT_PORT}`;
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
