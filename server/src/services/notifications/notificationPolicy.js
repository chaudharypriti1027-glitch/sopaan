import { Notification } from '../../models/Notification.js';
import { startOfDay } from '../../utils/pagination.js';
import {
  DEFAULT_DAILY_PUSH_CAP,
  DEFAULT_QUIET_HOURS,
  DEFAULT_TYPE_PREFERENCES,
  PUSH_ELIGIBLE_TYPES,
} from './notificationTypes.js';

function parseTimeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function getMinutesInTimezone(date, timezone) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
    return hour * 60 + minute;
  } catch {
    return date.getHours() * 60 + date.getMinutes();
  }
}

export function resolveNotificationPreferences(user) {
  const stored = user.notificationPreferences ?? {};
  const types = {
    ...DEFAULT_TYPE_PREFERENCES,
    ...(stored.types ?? {}),
  };

  if (user.currentAffairsAlertsEnabled !== undefined) {
    types.new_current_affairs = user.currentAffairsAlertsEnabled;
  }

  return {
    pushEnabled: user.pushNotificationsEnabled !== false,
    dailyPushCap: stored.dailyPushCap ?? DEFAULT_DAILY_PUSH_CAP,
    types,
    quietHours: {
      ...DEFAULT_QUIET_HOURS,
      ...(stored.quietHours ?? {}),
    },
  };
}

export function isTypeEnabled(preferences, type) {
  if (!PUSH_ELIGIBLE_TYPES.has(type)) {
    return true;
  }

  return preferences.types[type] !== false;
}

export function isWithinQuietHours(quietHours, date = new Date()) {
  if (!quietHours?.enabled) {
    return false;
  }

  const timezone = quietHours.timezone || DEFAULT_QUIET_HOURS.timezone;
  const nowMinutes = getMinutesInTimezone(date, timezone);
  const startMinutes = parseTimeToMinutes(quietHours.start || DEFAULT_QUIET_HOURS.start);
  const endMinutes = parseTimeToMinutes(quietHours.end || DEFAULT_QUIET_HOURS.end);

  if (startMinutes === endMinutes) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }

  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

export async function countPushDeliveriesToday(userId) {
  const today = startOfDay(new Date());

  return Notification.countDocuments({
    userId,
    pushSent: true,
    createdAt: { $gte: today },
  });
}

export async function evaluatePushDelivery(user, type, { at = new Date() } = {}) {
  const preferences = resolveNotificationPreferences(user);

  if (!preferences.pushEnabled) {
    return { allowed: false, reason: 'push_disabled' };
  }

  if (!user.expoPushToken) {
    return { allowed: false, reason: 'missing_token' };
  }

  if (!isTypeEnabled(preferences, type)) {
    return { allowed: false, reason: 'type_disabled' };
  }

  if (isWithinQuietHours(preferences.quietHours, at)) {
    return { allowed: false, reason: 'quiet_hours' };
  }

  const sentToday = await countPushDeliveriesToday(user._id);

  if (sentToday >= preferences.dailyPushCap) {
    return { allowed: false, reason: 'daily_cap_reached', sentToday, cap: preferences.dailyPushCap };
  }

  return { allowed: true, preferences };
}

export function serializePreferencesForClient(user) {
  const preferences = resolveNotificationPreferences(user);

  return {
    pushNotificationsEnabled: preferences.pushEnabled,
    hasToken: Boolean(user.expoPushToken),
    dailyPushCap: preferences.dailyPushCap,
    types: preferences.types,
    quietHours: preferences.quietHours,
    currentAffairsAlerts: preferences.types.new_current_affairs,
  };
}
