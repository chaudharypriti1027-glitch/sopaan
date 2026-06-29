import { isExpoGoRuntime, isRemotePushSupported } from './notificationsModule';

/**
 * Remote push tokens are unavailable in Expo Go (SDK 53+).
 * Use a development build (`expo run:android` / EAS) to test push.
 */
export function isPushNotificationsSupported(): boolean {
  return isRemotePushSupported();
}

export function pushUnavailableReason(): string | null {
  if (isExpoGoRuntime()) {
    return 'Push notifications require a development build. They are not available in Expo Go.';
  }
  if (!isRemotePushSupported()) {
    return 'Push notifications require a physical device.';
  }
  return null;
}
