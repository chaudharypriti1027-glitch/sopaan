import type { PermissionResponse } from 'expo-modules-core';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import { isRemotePushSupported, loadNotificationsModule } from './notificationsModule';

export type PushRegistrationResult = {
  token: string;
  platform: 'ios' | 'android' | 'web';
};

export type PushRegistrationOptions = {
  /** When false (default), never prompt — only register if already granted. */
  requestPermission?: boolean;
};

let notificationHandlerConfigured = false;

async function ensureNotificationHandler() {
  if (notificationHandlerConfigured) {
    return;
  }

  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => {
      // Suppress banner/alert while the app is still launching or in background
      // transition; Android otherwise flashes the first queued push on cold start.
      const active = AppState.currentState === 'active';
      return {
        shouldShowAlert: active,
        shouldPlaySound: active,
        shouldSetBadge: true,
        shouldShowBanner: active,
        shouldShowList: active,
      };
    },
  });
  notificationHandlerConfigured = true;
}

export async function registerForPushNotificationsAsync(
  options: PushRegistrationOptions = {},
): Promise<PushRegistrationResult | null> {
  const { requestPermission = false } = options;

  if (!isRemotePushSupported()) {
    return null;
  }

  await ensureNotificationHandler();
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return null;
  }

  const permissions = (await Notifications.getPermissionsAsync()) as PermissionResponse;
  let granted = permissions.granted;

  if (!granted && requestPermission) {
    const requested = (await Notifications.requestPermissionsAsync()) as PermissionResponse;
    granted = requested.granted;
  }

  if (!granted) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Sopaan',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  const platform =
    Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

  return {
    token: tokenResponse.data,
    platform,
  };
}
