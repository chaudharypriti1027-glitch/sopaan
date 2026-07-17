import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import {
  navigateFromNotificationPayload,
  type NotificationPayload,
} from '../notifications/notificationDeepLinks';
import { trackNotificationOpen } from '../api/notifications';
import { isRemotePushSupported, loadNotificationsModule } from '../notifications/notificationsModule';

const HANDLED_RESPONSE_KEY = 'sopaan.lastHandledNotificationResponse';

type NotificationResponseLike = {
  actionIdentifier?: string;
  notification?: {
    date?: number;
    request?: {
      identifier?: string;
      content?: { data?: unknown };
    };
  };
};

function extractPayload(response: NotificationResponseLike) {
  const raw = response.notification?.request?.content?.data;

  if (!raw || typeof raw !== 'object') {
    return null;
  }

  return raw as NotificationPayload;
}

function responseIdentity(response: NotificationResponseLike) {
  const identifier = response.notification?.request?.identifier;
  if (typeof identifier === 'string' && identifier.length > 0) {
    return identifier;
  }

  const date = response.notification?.date;
  if (typeof date === 'number' && Number.isFinite(date)) {
    return `date:${date}`;
  }

  return null;
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

async function wasAlreadyHandled(identity: string | null) {
  if (!identity) {
    return true;
  }

  try {
    const previous = await AsyncStorage.getItem(HANDLED_RESPONSE_KEY);
    return previous === identity;
  } catch {
    return false;
  }
}

async function markHandled(identity: string | null) {
  if (!identity) {
    return;
  }

  try {
    await AsyncStorage.setItem(HANDLED_RESPONSE_KEY, identity);
  } catch {
    // ignore persistence failures
  }
}

function handleResponse(response: NotificationResponseLike) {
  const payload = extractPayload(response);
  if (!payload) {
    return;
  }

  trackPushOpen(payload);
  navigateFromNotificationPayload(payload);
}

/**
 * Handles notification taps. Android keeps returning the last response across
 * cold starts, so we only navigate once per response identity.
 */
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

      const lastResponse =
        (await Notifications.getLastNotificationResponseAsync()) as NotificationResponseLike | null;

      if (lastResponse) {
        const identity = responseIdentity(lastResponse);
        const alreadyHandled = await wasAlreadyHandled(identity);

        if (!cancelled && !alreadyHandled) {
          await markHandled(identity);
          handleResponse(lastResponse);
        }
      }

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const typed = response as NotificationResponseLike;
        const identity = responseIdentity(typed);
        void markHandled(identity);
        handleResponse(typed);
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);
}

export { openInAppNotification } from '../notifications/notificationDeepLinks';
