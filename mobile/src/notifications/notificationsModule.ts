import Constants from 'expo-constants';
import * as Device from 'expo-device';

export type NotificationsModule = typeof import('expo-notifications');

let cachedModule: NotificationsModule | null | undefined;

/** True when running inside the Expo Go client (SDK 53+ has no remote push). */
export function isExpoGoRuntime(): boolean {
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient'
  );
}

/** Remote push tokens require a dev/production build on a physical device. */
export function isRemotePushSupported(): boolean {
  if (isExpoGoRuntime()) {
    return false;
  }
  return Device.isDevice;
}

/**
 * Lazy-load expo-notifications only in supported runtimes.
 * Never import in Expo Go — the module throws on Android SDK 53+.
 */
export async function loadNotificationsModule(): Promise<NotificationsModule | null> {
  if (!isRemotePushSupported()) {
    return null;
  }

  if (cachedModule !== undefined) {
    return cachedModule;
  }

  try {
    cachedModule = await import('expo-notifications');
    return cachedModule;
  } catch {
    cachedModule = null;
    return null;
  }
}
