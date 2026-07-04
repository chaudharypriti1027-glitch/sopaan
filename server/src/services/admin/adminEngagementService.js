import { User } from '../../models/User.js';
import { Notification } from '../../models/Notification.js';
import { Course } from '../../models/Course.js';
import { subtractDays } from '../../utils/testHelpers.js';
import { dispatchNotificationToMatchingStudents } from '../notifications/notificationDispatchService.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';

const ADMIN_NOTIFICATION_TYPES = Object.freeze({
  BROADCAST: 'admin_broadcast',
  ANNOUNCEMENT: 'admin_announcement',
});

function audienceFilter(audience) {
  switch (audience) {
    case 'pro':
      return { isPremium: true };
    case 'free':
      return { isPremium: { $ne: true } };
    case 'active': {
      const since = subtractDays(new Date(), 30);
      return {
        $or: [
          { 'streak.lastActiveOn': { $gte: since } },
          { 'streak.lastActiveDate': { $gte: since } },
        ],
      };
    }
    default:
      return {};
  }
}

export async function broadcastNotification({ title, body, audience = 'all' }) {
  const filter = audienceFilter(audience);
  const result = await dispatchNotificationToMatchingStudents(
    filter,
    {
      type: ADMIN_NOTIFICATION_TYPES.BROADCAST,
      title,
      body,
      data: { audience },
    },
    { limit: 1000 },
  );

  return {
    ...result,
    audience,
    title,
    body,
    sentAt: new Date().toISOString(),
  };
}

export async function publishAnnouncement({ message, link = 'Premium' }) {
  const title = 'Announcement';
  const body = message;
  const result = await dispatchNotificationToMatchingStudents(
    {},
    {
      type: ADMIN_NOTIFICATION_TYPES.ANNOUNCEMENT,
      title,
      body,
      data: { link, banner: true },
    },
    { limit: 1000 },
  );

  return {
    ...result,
    message,
    link,
    publishedAt: new Date().toISOString(),
  };
}

export async function listRecentBroadcasts(query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 10, maxLimit: 50 });
  const types = [ADMIN_NOTIFICATION_TYPES.BROADCAST, ADMIN_NOTIFICATION_TYPES.ANNOUNCEMENT];

  const [items, total] = await Promise.all([
    Notification.find({ type: { $in: types } })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .select('title body type createdAt pushSent')
      .lean(),
    Notification.countDocuments({ type: { $in: types } }),
  ]);

  return buildPaginatedResult({
    items: items.map((row) => ({
      id: row._id.toString(),
      title: row.title,
      body: row.body,
      type: row.type,
      pushSent: row.pushSent,
      sentAt: row.createdAt,
    })),
    total,
    limit,
    offset,
  });
}

export async function listTeamMembers() {
  const users = await User.find({ role: { $in: ['admin', 'mentor'] } })
    .sort({ role: 1, name: 1 })
    .select('name email role createdAt')
    .lean();

  return {
    items: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email ?? null,
      role: user.role,
      status: 'active',
      joinedAt: user.createdAt,
    })),
  };
}

export async function listMediaAssets(query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 30, maxLimit: 100 });

  const [courses, total] = await Promise.all([
    Course.find({})
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .select('title subject status lessons updatedAt')
      .lean(),
    Course.countDocuments({}),
  ]);

  const items = courses.flatMap((course) => {
    const lessons = course.lessons ?? [];
    if (lessons.length === 0) {
      return [
        {
          id: `${course._id.toString()}-course`,
          title: course.title,
          type: 'course',
          subject: course.subject,
          status: course.status,
          url: null,
          updatedAt: course.updatedAt,
        },
      ];
    }

    return lessons.map((lesson, index) => ({
      id: `${course._id.toString()}-${index}`,
      title: lesson.title || course.title,
      type: 'lesson',
      subject: course.subject,
      status: course.status,
      url: lesson.videoUrl ?? null,
      updatedAt: course.updatedAt,
    }));
  });

  return {
    items: items.slice(0, limit),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}
