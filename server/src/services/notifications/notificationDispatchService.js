import { Notification } from '../../models/Notification.js';
import { User } from '../../models/User.js';
import * as pushTransport from '../pushNotificationService.js';
import { evaluatePushDelivery } from './notificationPolicy.js';
import { mergeNotificationData } from './notificationTypes.js';

export async function dispatchNotification(
  userId,
  { type, title, body, data, channels = ['in_app', 'push'], campaignId },
) {
  const includeInApp = channels.includes('in_app');
  const includePush = channels.includes('push');
  const enrichedData = mergeNotificationData(type, data ?? {});

  let notification = null;
  let pushResult = { sent: false, reason: 'skipped' };

  if (includeInApp) {
    notification = await Notification.create({
      userId,
      type,
      title,
      body,
      data: enrichedData,
      pushSent: false,
      campaignId: campaignId ?? undefined,
    });
  }

  if (includePush) {
    const user = await User.findById(userId)
      .select('expoPushToken pushNotificationsEnabled currentAffairsAlertsEnabled notificationPreferences')
      .lean();

    if (user) {
      const decision = await evaluatePushDelivery(user, type);

      if (decision.allowed) {
        const pushData = {
          ...enrichedData,
          ...(campaignId ? { campaignId: campaignId.toString() } : {}),
          ...(notification ? { notificationId: notification._id.toString() } : {}),
        };

        pushResult = await pushTransport.deliverPushToUser(userId, {
          type,
          title,
          body,
          data: pushData,
        });

        if (pushResult.sent && notification) {
          notification.pushSent = true;
          await notification.save();
        } else if (pushResult.sent && !notification) {
          notification = await Notification.create({
            userId,
            type,
            title,
            body,
            data: enrichedData,
            pushSent: true,
            campaignId: campaignId ?? undefined,
          });
        }
      } else {
        pushResult = { sent: false, reason: decision.reason, ...decision };
      }
    }
  }

  return {
    notification,
    push: pushResult,
  };
}

export async function dispatchNotificationToUsers(
  userIds,
  { type, title, body, data, channels = ['in_app', 'push'], limit = 500, campaignId },
) {
  const targets = userIds.slice(0, limit);
  let inApp = 0;
  let pushSent = 0;
  let skipped = 0;

  for (const userId of targets) {
    const result = await dispatchNotification(userId, {
      type,
      title,
      body,
      data,
      channels,
      campaignId,
    });

    if (result.notification) {
      inApp += 1;
    }

    if (result.push?.sent) {
      pushSent += 1;
    } else if (includePushChannel(channels)) {
      skipped += 1;
    }
  }

  return { inApp, pushSent, skipped, targeted: targets.length };
}

function includePushChannel(channels) {
  return channels.includes('push');
}

export async function dispatchNotificationToMatchingStudents(
  filter,
  payload,
  { limit = 500, channels = ['in_app', 'push'] } = {},
) {
  const users = await User.find({
    role: 'student',
    ...filter,
  })
    .select('_id')
    .limit(limit)
    .lean();

  return dispatchNotificationToUsers(
    users.map((user) => user._id),
    { ...payload, channels },
  );
}
