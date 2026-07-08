import { useEffect } from 'react';
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
        navigateFromNotificationPayload(lastPayload);
      }

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const payload = extractPayload(response);
        if (payload) {
          trackPushOpen(payload);
          navigateFromNotificationPayload(payload);
        }
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);
}

export { openInAppNotification } from '../notifications/notificationDeepLinks';
