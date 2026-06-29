import type { PermissionResponse } from 'expo-modules-core';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { isRemotePushSupported, loadNotificationsModule } from './notificationsModule';

export type PushRegistrationResult = {
  token: string;
  platform: 'ios' | 'android' | 'web';
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
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  notificationHandlerConfigured = true;
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult | null> {
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

  if (!granted) {
    const requested = (await Notifications.requestPermissionsAsync()) as PermissionResponse;
    granted = requested.granted;
  }

  if (!granted) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Sopaan',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
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
