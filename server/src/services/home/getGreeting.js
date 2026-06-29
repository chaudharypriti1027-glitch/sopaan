import { Notification } from '../../models/Notification.js';
import {
  formatIstDateLabel,
  getIstHour,
  greetingMessageForHour,
} from '../../utils/date.js';
import { safeHomeCall } from './safe.js';

export function buildGreetingFromUser(user, { unreadCount = 0, now = new Date() } = {}) {
  const hour = getIstHour(now);

  return {
    name: user?.name ?? '',
    message: greetingMessageForHour(hour),
    dateLabel: formatIstDateLabel(now),
    avatarUrl: user?.avatarUrl?.trim() || undefined,
    unreadCount,
  };
}

const GREETING_FALLBACK = {
  name: '',
  message: 'Hello',
  dateLabel: '',
  unreadCount: 0,
};

export async function getGreeting(user) {
  return safeHomeCall('getGreeting', async () => {
    if (!user?._id) {
      return { ...GREETING_FALLBACK, name: user?.name ?? '' };
    }

    const unreadCount = await Notification.countDocuments({ userId: user._id, read: false });
    return buildGreetingFromUser(user, { unreadCount });
  }, {
    ...GREETING_FALLBACK,
    name: user?.name ?? '',
    dateLabel: formatIstDateLabel(),
  });
}
