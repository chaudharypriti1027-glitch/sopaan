import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import {
  navigateFromNotificationPayload,
  type NotificationPayload,
} from '../notifications/notificationDeepLinks';
import { trackNotificationOpen } from '../api/notifications';
import { isRemotePushSupported, loadNotificationsModule } from '../notifications/notificationsModule';

function extractPayload(response: { notification?: { request?: { content?: { data?: unknown } } } }) {
  const raw = response.notification?.request?.content?.data;

  if (!raw || typeof raw !== 'object') {
    return null;
  }

  return raw as NotificationPayload;
}

function trackPushOpen(payload: NotificationPayload | null) {
  if (!payload) {
    return;
  }

  const notificationId =
    typeof payload.notificationId === 'string' ? payload.notificationId : undefined;
  const campaignId = typeof payload.campaignId === 'string' ? payload.campaignId : undefined;

  if (!notificationId && !campaignId) {
    return;
  }

  void trackNotificationOpen({ notificationId, campaignId }).catch(() => {
    // best-effort analytics
  });
}

export function useNotificationDeepLink() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  useEffect(() => {
    if (!isRemotePushSupported()) {
      return;
    }

    let subscription: { remove: () => void } | undefined;
    let cancelled = false;

    void (async () => {
      const Notifications = await loadNotificationsModule();

      if (cancelled || !Notifications) {
        return;
      }

      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      const lastPayload = lastResponse ? extractPayload(lastResponse) : null;

      if (lastPayload) {
        trackPushOpen(lastPayload);
        navigateFromNotificationPayload(navigation, lastPayload);
      }

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const payload = extractPayload(response);
        if (payload) {
          trackPushOpen(payload);
          navigateFromNotificationPayload(navigation, payload);
        }
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [navigation]);
}

export function openInAppNotification(
  navigation: NativeStackNavigationProp<MainStackParamList>,
  notification: { type: string; data?: NotificationPayload | null },
) {
  const payload: NotificationPayload = {
    type: notification.type,
    ...(notification.data ?? {}),
  };

  navigateFromNotificationPayload(navigation, payload);
}
