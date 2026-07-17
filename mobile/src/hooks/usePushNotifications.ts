import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { notificationsApi } from '../api';
import { useAuth } from '../auth';
import { loadSettings } from '../settings/settingsStorage';
import { isPushNotificationsSupported } from '../notifications/pushAvailability';
import { registerForPushNotificationsAsync } from '../notifications/pushRegistration';

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      registeredRef.current = false;
      return;
    }

    if (registeredRef.current) {
      return;
    }

    let cancelled = false;

    void (async () => {
      if (!isPushNotificationsSupported()) {
        return;
      }

      const settings = await loadSettings();
      if (!settings.pushNotifications) {
        await notificationsApi.updatePushSettings(false);
        return;
      }

      // Never prompt on cold start — Android shows a system dialog that feels like
      // a first notification. Request only from Settings via enablePushNotifications.
      const registration = await registerForPushNotificationsAsync({
        requestPermission: false,
      });
      if (cancelled || !registration) {
        return;
      }

      await notificationsApi.registerPushToken({
        token: registration.token,
        platform: registration.platform,
      });
      registeredRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);
}

export function useUpdatePushSettings() {
  return useMutation({
    mutationFn: (enabled: boolean) => notificationsApi.updatePushSettings(enabled),
  });
}

export async function enablePushNotifications(): Promise<boolean> {
  const registration = await registerForPushNotificationsAsync({
    requestPermission: true,
  });
  if (!registration) {
    return false;
  }

  await notificationsApi.registerPushToken({
    token: registration.token,
    platform: registration.platform,
  });
  await notificationsApi.updatePushSettings(true);
  return true;
}

export async function disablePushNotifications(): Promise<void> {
  await notificationsApi.updatePushSettings(false);
}

export { isPushNotificationsSupported, pushUnavailableReason } from '../notifications/pushAvailability';
