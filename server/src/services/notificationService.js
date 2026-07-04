import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { recordCampaignOpen } from './admin/adminNotificationService.js';
import { dispatchNotification } from './notifications/notificationDispatchService.js';
import {
  resolveNotificationPreferences,
  serializePreferencesForClient,
} from './notifications/notificationPolicy.js';
import { DEFAULT_TYPE_PREFERENCES } from './notifications/notificationTypes.js';
import * as pushTransport from './pushNotificationService.js';

export { NOTIFICATION_TYPES, PUSH_TYPES } from './notifications/notificationTypes.js';
export { dispatchNotification, dispatchNotificationToUsers, dispatchNotificationToMatchingStudents } from './notifications/notificationDispatchService.js';

export async function createNotification(userId, { type, title, body, data, sendPush = true }) {
  const channels = sendPush ? ['in_app', 'push'] : ['in_app'];
  const result = await dispatchNotification(userId, { type, title, body, data, channels });
  return result.notification;
}

export async function listNotifications(userId, query) {
  const { limit, offset } = parsePagination(query);

  const [items, total] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    Notification.countDocuments({ userId }),
  ]);

  return buildPaginatedResult({ items, total, limit, offset });
}

export async function markNotificationRead(userId, notificationId) {
  const notification = await Notification.findOne({ _id: notificationId, userId });

  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND');
  }

  if (!notification.read) {
    const now = new Date();
    notification.read = true;
    notification.readAt = now;
    notification.openedAt = notification.openedAt ?? now;
    await notification.save();

    if (notification.campaignId) {
      await recordCampaignOpen(notification.campaignId);
    }
  }

  return notification;
}

export async function trackNotificationOpen(userId, { notificationId, campaignId } = {}) {
  if (notificationId) {
    return markNotificationRead(userId, notificationId);
  }

  if (campaignId) {
    await recordCampaignOpen(campaignId);
    return { tracked: true, campaignId };
  }

  throw new AppError('notificationId or campaignId is required', 400, 'VALIDATION_ERROR');
}

export async function registerPushToken(userId, input) {
  return pushTransport.registerPushToken(userId, input);
}

export async function updatePushSettings(userId, enabled) {
  return pushTransport.updatePushSettings(userId, enabled);
}

export async function getNotificationPreferences(userId) {
  const user = await User.findById(userId)
    .select('pushNotificationsEnabled currentAffairsAlertsEnabled expoPushToken notificationPreferences')
    .lean();

  if (!user) {
    return serializePreferencesForClient({
      pushNotificationsEnabled: false,
      currentAffairsAlertsEnabled: false,
      expoPushToken: null,
      notificationPreferences: {},
    });
  }

  return serializePreferencesForClient(user);
}

export async function updateNotificationPreferences(userId, patch) {
  const user = await User.findById(userId).select('notificationPreferences currentAffairsAlertsEnabled');

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const current = resolveNotificationPreferences(user);
  const nextTypes = { ...current.types, ...(patch.types ?? {}) };

  user.notificationPreferences = {
    ...(user.notificationPreferences ?? {}),
    types: nextTypes,
    dailyPushCap: patch.dailyPushCap ?? current.dailyPushCap,
    quietHours: {
      ...current.quietHours,
      ...(patch.quietHours ?? {}),
    },
  };

  if (patch.types?.new_current_affairs !== undefined) {
    user.currentAffairsAlertsEnabled = patch.types.new_current_affairs;
  } else if (patch.currentAffairsAlerts !== undefined) {
    user.currentAffairsAlertsEnabled = patch.currentAffairsAlerts;
    nextTypes.new_current_affairs = patch.currentAffairsAlerts;
    user.notificationPreferences.types = nextTypes;
  }

  await user.save();

  const refreshed = await User.findById(userId)
    .select('pushNotificationsEnabled currentAffairsAlertsEnabled expoPushToken notificationPreferences')
    .lean();

  return serializePreferencesForClient(refreshed);
}

/** @deprecated use getNotificationPreferences */
export async function getAlertPreferences(userId) {
  const prefs = await getNotificationPreferences(userId);
  return {
    pushNotificationsEnabled: prefs.pushNotificationsEnabled,
    currentAffairsAlerts: prefs.currentAffairsAlerts,
    hasToken: prefs.hasToken,
  };
}

/** @deprecated use updateNotificationPreferences */
export async function updateAlertPreferences(userId, { currentAffairsAlerts }) {
  const prefs = await updateNotificationPreferences(userId, {
    currentAffairsAlerts,
    types: { new_current_affairs: currentAffairsAlerts },
  });

  return {
    pushNotificationsEnabled: prefs.pushNotificationsEnabled,
    currentAffairsAlerts: prefs.currentAffairsAlerts,
    hasToken: prefs.hasToken,
  };
}

export function defaultNotificationTypePreferences() {
  return { ...DEFAULT_TYPE_PREFERENCES };
}
