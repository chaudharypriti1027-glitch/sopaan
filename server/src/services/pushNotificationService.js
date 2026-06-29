import { User } from '../models/User.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function buildMessage(token, { title, body, type, data }) {
  return {
    to: token,
    title,
    body,
    sound: 'default',
    data: {
      type,
      ...data,
    },
  };
}

async function postExpoPush(messages) {
  if (!messages.length) {
    return { data: [] };
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[push] Expo API error:', response.status, text);
    return { data: [] };
  }

  return response.json();
}

async function clearInvalidToken(userId) {
  await User.findByIdAndUpdate(userId, {
    expoPushToken: null,
    expoPushPlatform: null,
  });
}

export async function deliverPushToUser(userId, { type, title, body, data }) {
  const user = await User.findById(userId).select('expoPushToken').lean();

  if (!user?.expoPushToken) {
    return { sent: false, reason: 'missing_token' };
  }

  const message = buildMessage(user.expoPushToken, { title, body, type, data });
  const result = await postExpoPush([message]);
  const ticket = result.data?.[0];

  if (ticket?.status === 'error') {
    if (ticket.details?.error === 'DeviceNotRegistered') {
      await clearInvalidToken(userId);
    }
    return { sent: false, reason: ticket.message ?? 'expo_error' };
  }

  return { sent: true, ticketId: ticket?.id };
}

export async function registerPushToken(userId, { token, platform }) {
  await User.findByIdAndUpdate(userId, {
    expoPushToken: token,
    expoPushPlatform: platform ?? null,
    pushNotificationsEnabled: true,
  });

  return { registered: true };
}

export async function updatePushSettings(userId, enabled) {
  const user = await User.findByIdAndUpdate(
    userId,
    { pushNotificationsEnabled: enabled },
    { new: true },
  ).select('pushNotificationsEnabled expoPushToken currentAffairsAlertsEnabled notificationPreferences');

  if (!enabled) {
    return { pushNotificationsEnabled: false };
  }

  const { serializePreferencesForClient } = await import('./notifications/notificationPolicy.js');

  return {
    pushNotificationsEnabled: user.pushNotificationsEnabled,
    hasToken: Boolean(user.expoPushToken),
    currentAffairsAlerts: user.currentAffairsAlertsEnabled,
    ...serializePreferencesForClient(user),
  };
}
