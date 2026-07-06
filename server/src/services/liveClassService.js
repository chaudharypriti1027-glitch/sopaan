import { nanoid } from 'nanoid';
import { LiveClass } from '../models/LiveClass.js';
import { LiveClassReminder } from '../models/LiveClassReminder.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { parsePagination } from '../utils/pagination.js';
import { getStreamingProvider, isStreamingConfigured, safeCreateStreamingRoom } from './streaming/index.js';
import { normalizeUserRole, isAdminRole } from '../constants/userRoles.js';
import { dispatchNotificationToMatchingStudents } from './notifications/notificationDispatchService.js';
import { clearLiveClassRoomState } from '../realtime/liveNamespace.js';

const LIVE_CLASS_NOTIFICATION_TYPE = 'live_class_scheduled';

function resolveRoomName(doc) {
  return doc.roomName ?? doc.streamingRoomId;
}

function resolveStartsAt(doc) {
  return doc.startsAt ?? doc.scheduledAt;
}

function resolveEducatorId(doc) {
  return doc.educatorId ?? doc.instructorId;
}

function formatLiveClass(doc, { reminderSet = false } = {}) {
  const viewers = doc.viewersPeak ?? doc.attendeeCount ?? 0;

  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    educatorId: resolveEducatorId(doc)?.toString?.() ?? resolveEducatorId(doc) ?? null,
    instructor: doc.instructor,
    instructorId: resolveEducatorId(doc)?.toString?.() ?? resolveEducatorId(doc) ?? null,
    exam: doc.exam ?? doc.examTag,
    examTag: doc.exam ?? doc.examTag,
    topic: doc.topic ?? null,
    startsAt: resolveStartsAt(doc),
    scheduledAt: resolveStartsAt(doc),
    durationMin: doc.durationMin,
    thumbnailColor: doc.thumbnailColor,
    coverUrl: doc.coverUrl ?? doc.thumbnailUrl ?? null,
    thumbnailUrl: doc.coverUrl ?? doc.thumbnailUrl ?? null,
    status: doc.status,
    roomName: resolveRoomName(doc),
    autoRecord: Boolean(doc.autoRecord),
    startedAt: doc.startedAt ?? null,
    endedAt: doc.endedAt ?? null,
    viewersPeak: doc.viewersPeak ?? 0,
    viewers,
    attendeeCount: doc.attendeeCount ?? viewers,
    reminderSet,
    recordingUrl: doc.recordingUrl ?? null,
    recordingStatus: doc.recordingStatus ?? null,
    recordingPublished: Boolean(doc.recordingPublished),
    recordingDurationSec: doc.recordingDurationSec ?? null,
    egressId: doc.egressId ?? doc.livekitEgressId ?? null,
    streamingConfigured: isStreamingConfigured(),
  };
}

function isLiveClassHost(userId, liveClass, user) {
  const id = userId.toString();
  const educatorId = resolveEducatorId(liveClass);

  if (educatorId && educatorId.toString() === id) {
    return true;
  }

  if (isAdminRole(user?.role)) {
    return true;
  }

  if (
    liveClass.createdBy &&
    liveClass.createdBy.toString() === id &&
    ['admin', 'creator'].includes(normalizeUserRole(user?.role))
  ) {
    return true;
  }

  return false;
}

function buildRoomName(title) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

  return `${slug || 'class'}-${nanoid(10)}`;
}

function normalizeCreatePayload(data) {
  return {
    title: data.title,
    description: data.description,
    educatorId: data.educatorId ?? data.instructorId,
    instructor: data.instructor,
    exam: data.exam ?? data.examTag,
    topic: data.topic,
    startsAt: data.startsAt ?? data.scheduledAt,
    durationMin: data.durationMin,
    coverUrl: data.coverUrl ?? data.thumbnailUrl,
    thumbnailColor: data.thumbnailColor,
    autoRecord: Boolean(data.autoRecord),
    notify: Boolean(data.notify),
    status: data.status ?? 'scheduled',
  };
}

async function refreshAttendeeCount(liveClass) {
  if (liveClass.status !== 'live') {
    return liveClass.attendeeCount ?? 0;
  }

  const provider = getStreamingProvider();
  const roomName = resolveRoomName(liveClass);
  const count = await provider.getParticipantCount(roomName);
  liveClass.attendeeCount = count;

  if (count > (liveClass.viewersPeak ?? 0)) {
    liveClass.viewersPeak = count;
  }

  await liveClass.save();
  return count;
}

async function notifyLiveClassScheduled(liveClass) {
  const startsAt = resolveStartsAt(liveClass);
  const when = startsAt ? new Date(startsAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'soon';

  await dispatchNotificationToMatchingStudents(
    {},
    {
      type: LIVE_CLASS_NOTIFICATION_TYPE,
      title: `Live class: ${liveClass.title}`,
      body: `Starts ${when}. Tap to view details.`,
      data: {
        link: 'LiveClasses',
        banner: true,
        liveClassId: liveClass._id.toString(),
        coverImageUrl: liveClass.coverUrl ?? liveClass.thumbnailUrl ?? null,
      },
    },
    { limit: 1000 },
  );
}

export async function listAdminLiveClasses(query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 50, maxLimit: 100 });
  const filter = query.status ? { status: query.status } : {};

  const [classes, total, liveCount, scheduledCount, recordingCount] = await Promise.all([
    LiveClass.find(filter).sort({ startsAt: -1, scheduledAt: -1 }).skip(offset).limit(limit).lean(),
    LiveClass.countDocuments(filter),
    LiveClass.countDocuments({ status: 'live' }),
    LiveClass.countDocuments({ status: 'scheduled' }),
    LiveClass.countDocuments({
      status: 'ended',
      recordingUrl: { $exists: true, $nin: [null, ''] },
    }),
  ]);

  const items = classes.map((doc) => formatLiveClass(doc));

  return {
    items,
    summary: {
      liveCount,
      scheduledCount,
      recordingCount,
      watchingNow: items
        .filter((item) => item.status === 'live')
        .reduce((sum, item) => sum + (item.viewers ?? 0), 0),
    },
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    },
  };
}

export async function listLiveClasses(userId, query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 20, maxLimit: 50 });
  const now = new Date();
  const filter = {
    $or: [
      { status: 'live' },
      { status: 'scheduled', startsAt: { $gte: now } },
      { status: 'scheduled', scheduledAt: { $gte: now } },
    ],
  };

  const [classes, total, reminders] = await Promise.all([
    LiveClass.find(filter)
      .sort({ status: -1, startsAt: 1, scheduledAt: 1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    LiveClass.countDocuments(filter),
    userId
      ? LiveClassReminder.find({ userId }).select('liveClassId').lean()
      : Promise.resolve([]),
  ]);

  const reminderIds = new Set(reminders.map((item) => item.liveClassId.toString()));
  const formatted = classes.map((doc) =>
    formatLiveClass(doc, { reminderSet: reminderIds.has(doc._id.toString()) }),
  );

  const liveNow = formatted.find((item) => item.status === 'live') ?? null;
  const scheduled = formatted.filter((item) => item.status === 'scheduled');

  const recordedDocs = await LiveClass.find({
    status: 'ended',
    recordingPublished: true,
    recordingUrl: { $exists: true, $nin: [null, ''] },
  })
    .sort({ endedAt: -1 })
    .limit(20)
    .lean();

  const recorded = recordedDocs.map((doc) => formatLiveClass(doc));

  return {
    streamingConfigured: isStreamingConfigured(),
    comingSoon: !isStreamingConfigured(),
    message: isStreamingConfigured()
      ? null
      : 'Full live classroom experience is coming soon.',
    liveNow,
    scheduled,
    recorded,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + formatted.length < total,
    },
  };
}

export async function getLiveClassById(id, userId) {
  const liveClass = await LiveClass.findById(id).lean();

  if (!liveClass) {
    throw new AppError('Live class not found', 404, 'NOT_FOUND');
  }

  let reminderSet = false;

  if (userId) {
    reminderSet = Boolean(
      await LiveClassReminder.exists({ userId, liveClassId: liveClass._id }),
    );
  }

  if (liveClass.status === 'live') {
    const doc = await LiveClass.findById(id);
    await refreshAttendeeCount(doc);
    return formatLiveClass(doc.toObject(), { reminderSet });
  }

  return formatLiveClass(liveClass, { reminderSet });
}

export async function createLiveClass(userId, data) {
  const payload = normalizeCreatePayload(data);
  const provider = getStreamingProvider();
  const educatorUser = payload.educatorId
    ? await User.findById(payload.educatorId).select('name role').lean()
    : null;

  const instructorName = payload.instructor ?? educatorUser?.name ?? 'Sopaan Faculty';
  const roomName = buildRoomName(payload.title);

  if (provider.isConfigured()) {
    await safeCreateStreamingRoom(provider, {
      roomName,
      metadata: { title: payload.title, exam: payload.exam, topic: payload.topic },
    });
  }

  const activeProvider = getStreamingProvider();

  const liveClass = await LiveClass.create({
    title: payload.title,
    description: payload.description,
    instructor: instructorName,
    educatorId: educatorUser?._id ?? userId,
    exam: payload.exam,
    topic: payload.topic,
    startsAt: payload.startsAt,
    durationMin: payload.durationMin,
    thumbnailColor: payload.thumbnailColor,
    coverUrl: payload.coverUrl,
    status: payload.status,
    roomName,
    streamingProvider: activeProvider.id,
    autoRecord: payload.autoRecord,
    startedAt: payload.status === 'live' ? new Date() : undefined,
    createdBy: userId,
  });

  if (payload.notify) {
    await notifyLiveClassScheduled(liveClass);
  }

  return formatLiveClass(liveClass.toObject());
}

export async function patchAdminLiveClass(userId, id, data) {
  const liveClass = await LiveClass.findById(id);

  if (!liveClass) {
    throw new AppError('Live class not found', 404, 'NOT_FOUND');
  }

  if (liveClass.status === 'ended') {
    throw new AppError('Ended classes cannot be edited', 400, 'INVALID_STATUS');
  }

  if (data.status === 'cancelled') {
    if (!['scheduled', 'live'].includes(liveClass.status)) {
      throw new AppError('Only scheduled or live classes can be cancelled', 400, 'INVALID_STATUS');
    }

    if (liveClass.status === 'live') {
      liveClass.endedAt = new Date();
    }

    liveClass.status = 'cancelled';
  }

  if (data.title !== undefined) liveClass.title = data.title;
  if (data.description !== undefined) liveClass.description = data.description;
  if (data.topic !== undefined) liveClass.topic = data.topic;
  if (data.exam !== undefined) liveClass.exam = data.exam;
  if (data.startsAt !== undefined) liveClass.startsAt = data.startsAt;
  if (data.durationMin !== undefined) liveClass.durationMin = data.durationMin;
  if (data.autoRecord !== undefined) liveClass.autoRecord = data.autoRecord;

  if (data.coverUrl !== undefined) {
    liveClass.coverUrl = data.coverUrl || undefined;
  }

  if (liveClass.status === 'scheduled' && data.startsAt === undefined) {
    // allow other field edits only
  } else if (liveClass.status === 'live' && (data.startsAt !== undefined || data.durationMin !== undefined)) {
    throw new AppError('Cannot change schedule while class is live', 400, 'INVALID_STATUS');
  }

  await liveClass.save();
  return formatLiveClass(liveClass.toObject());
}

export async function startLiveClass(userId, id) {
  const liveClass = await LiveClass.findById(id);

  if (!liveClass) {
    throw new AppError('Live class not found', 404, 'NOT_FOUND');
  }

  if (!['scheduled', 'live'].includes(liveClass.status)) {
    throw new AppError('Only scheduled classes can be started', 400, 'INVALID_STATUS');
  }

  if (liveClass.status === 'live') {
    return formatLiveClass(liveClass.toObject());
  }

  liveClass.status = 'live';
  liveClass.startedAt = new Date();

  const provider = getStreamingProvider();
  const roomName = resolveRoomName(liveClass);

  if (typeof provider.createRoom === 'function') {
    await safeCreateStreamingRoom(provider, {
      roomName,
      metadata: { liveClassId: liveClass._id.toString() },
    });
    liveClass.streamingProvider = getStreamingProvider().id;
  }

  if (liveClass.autoRecord && getStreamingProvider().isConfigured() && typeof getStreamingProvider().startRecording === 'function') {
    const recordingProvider = getStreamingProvider();
    const recording = await recordingProvider.startRecording({
      roomName,
      liveClassId: liveClass._id.toString(),
    });

    if (recording?.egressId) {
      liveClass.egressId = recording.egressId;
      liveClass.livekitEgressId = recording.egressId;
    }

    if (recording?.recordingUrl) {
      liveClass.recordingUrl = recording.recordingUrl;
    }

    if (recording?.recordingStatus) {
      liveClass.recordingStatus = recording.recordingStatus;
    }
  }

  await liveClass.save();
  return formatLiveClass(liveClass.toObject());
}

export async function endLiveClass(userId, id) {
  const liveClass = await LiveClass.findById(id);

  if (!liveClass) {
    throw new AppError('Live class not found', 404, 'NOT_FOUND');
  }

  if (liveClass.status === 'ended') {
    return formatLiveClass(liveClass.toObject());
  }

  if (liveClass.status !== 'live') {
    throw new AppError('Only live classes can be ended', 400, 'INVALID_STATUS');
  }

  const provider = getStreamingProvider();
  const roomName = resolveRoomName(liveClass);
  const egressId = liveClass.egressId ?? liveClass.livekitEgressId;

  if (provider.isConfigured() && typeof provider.stopRecording === 'function') {
    const recording = await provider.stopRecording({
      egressId,
      roomName,
      liveClassId: liveClass._id.toString(),
    });

    if (recording?.recordingUrl) {
      liveClass.recordingUrl = recording.recordingUrl;
    }

    if (recording?.recordingStatus) {
      liveClass.recordingStatus = recording.recordingStatus;
    }
  }

  liveClass.status = 'ended';
  liveClass.endedAt = new Date();
  await liveClass.save();
  clearLiveClassRoomState(liveClass._id.toString());

  return formatLiveClass(liveClass.toObject());
}

export async function setRecordingPublished(userId, id, published) {
  const liveClass = await LiveClass.findById(id);

  if (!liveClass) {
    throw new AppError('Live class not found', 404, 'NOT_FOUND');
  }

  if (liveClass.status !== 'ended') {
    throw new AppError('Only ended classes can be published', 400, 'INVALID_STATUS');
  }

  if (!liveClass.recordingUrl) {
    throw new AppError('Recording is not ready yet', 400, 'RECORDING_NOT_READY');
  }

  if (liveClass.recordingStatus !== 'ready') {
    throw new AppError('Recording is not ready yet', 400, 'RECORDING_NOT_READY');
  }

  liveClass.recordingPublished = Boolean(published);
  await liveClass.save();

  return formatLiveClass(liveClass.toObject());
}

/** @deprecated use startLiveClass / endLiveClass */
export async function updateLiveClassStatus(userId, id, status) {
  if (status === 'live') {
    return startLiveClass(userId, id);
  }

  if (status === 'ended') {
    return endLiveClass(userId, id);
  }

  return patchAdminLiveClass(userId, id, { status: status === 'cancelled' ? 'cancelled' : undefined });
}

export async function createLiveToken(userId, liveClassId) {
  const liveClass = await LiveClass.findById(liveClassId);

  if (!liveClass) {
    throw new AppError('Live class not found', 404, 'NOT_FOUND');
  }

  if (!isStreamingConfigured()) {
    throw new AppError('Live streaming is not configured', 503, 'STREAMING_NOT_CONFIGURED');
  }

  const roomName = resolveRoomName(liveClass);

  if (liveClass.status === 'scheduled') {
    return {
      status: 'scheduled',
      liveClassId: liveClass._id.toString(),
      startsAt: resolveStartsAt(liveClass),
      roomName,
      token: null,
      message: 'This class has not started yet',
    };
  }

  if (liveClass.status === 'ended' || liveClass.status === 'cancelled') {
    return {
      status: liveClass.status,
      liveClassId: liveClass._id.toString(),
      roomName,
      token: null,
      recordingUrl: liveClass.recordingUrl ?? null,
      message: liveClass.status === 'cancelled' ? 'This class was cancelled' : 'This class has ended',
    };
  }

  if (liveClass.status !== 'live') {
    throw new AppError('This class is not available for viewing', 400, 'NOT_LIVE');
  }

  const provider = getStreamingProvider();
  const user = await User.findById(userId).select('name role').lean();
  const host = isLiveClassHost(userId, liveClass, user);

  if (typeof provider.createRoom === 'function') {
    await safeCreateStreamingRoom(provider, {
      roomName,
      metadata: { liveClassId: liveClass._id.toString() },
    });
  }

  const activeProvider = getStreamingProvider();
  if (liveClass.streamingProvider !== activeProvider.id) {
    liveClass.streamingProvider = activeProvider.id;
    await liveClass.save();
  }

  const credentials = host
    ? await activeProvider.createHostToken({
        roomName,
        identity: userId.toString(),
        name: user?.name ?? 'Educator',
      })
    : await activeProvider.createViewerToken({
        roomName,
        identity: userId.toString(),
        name: user?.name ?? 'Student',
      });

  await refreshAttendeeCount(liveClass);

  return {
    status: 'live',
    liveClassId: liveClass._id.toString(),
    roomName,
    provider: credentials.provider ?? activeProvider.id,
    url: credentials.url,
    token: credentials.token,
    role: host ? 'host' : 'student',
    canPublish: credentials.canPublish ?? host,
    canSubscribe: credentials.canSubscribe ?? true,
    canPublishData: credentials.canPublishData ?? true,
    attendeeCount: liveClass.attendeeCount,
    viewersPeak: liveClass.viewersPeak ?? 0,
  };
}

export async function createViewerToken(userId, liveClassId) {
  return createLiveToken(userId, liveClassId);
}

export async function setLiveClassReminder(userId, liveClassId) {
  const liveClass = await LiveClass.findById(liveClassId).lean();

  if (!liveClass) {
    throw new AppError('Live class not found', 404, 'NOT_FOUND');
  }

  if (liveClass.status !== 'scheduled') {
    throw new AppError('Reminders are only available for scheduled classes', 400, 'INVALID_STATUS');
  }

  const remindAt = new Date(resolveStartsAt(liveClass));
  remindAt.setMinutes(remindAt.getMinutes() - 15);

  await LiveClassReminder.findOneAndUpdate(
    { userId, liveClassId },
    { remindAt, notified: false },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return {
    liveClassId,
    remindAt: remindAt.toISOString(),
    reminderSet: true,
  };
}

export async function removeLiveClassReminder(userId, liveClassId) {
  await LiveClassReminder.deleteOne({ userId, liveClassId });
  return { liveClassId, reminderSet: false };
}

export async function countActiveLiveClasses() {
  return LiveClass.countDocuments({ status: 'live' });
}
