import crypto from 'crypto';
import { LiveClass } from '../models/LiveClass.js';
import { LiveClassReminder } from '../models/LiveClassReminder.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { parsePagination } from '../utils/pagination.js';
import { getStreamingProvider, isStreamingConfigured } from './streaming/index.js';

function formatLiveClass(doc, { reminderSet = false } = {}) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    instructor: doc.instructor,
    examTag: doc.examTag,
    scheduledAt: doc.scheduledAt,
    durationMin: doc.durationMin,
    thumbnailColor: doc.thumbnailColor,
    status: doc.status,
    startedAt: doc.startedAt,
    endedAt: doc.endedAt,
    viewers: doc.attendeeCount ?? 0,
    attendeeCount: doc.attendeeCount ?? 0,
    reminderSet,
    recordingUrl: doc.recordingUrl ?? null,
    recordingStatus: doc.recordingStatus ?? null,
    streamingConfigured: isStreamingConfigured(),
  };
}

function isLiveClassHost(userId, liveClass, user) {
  const id = userId.toString();

  if (liveClass.instructorId && liveClass.instructorId.toString() === id) {
    return true;
  }

  if (
    liveClass.createdBy &&
    liveClass.createdBy.toString() === id &&
    ['admin', 'mentor'].includes(user?.role)
  ) {
    return true;
  }

  return false;
}

function buildRoomId(title) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const suffix = crypto.randomBytes(3).toString('hex');
  return `sopaan-${slug || 'class'}-${suffix}`;
}

async function refreshAttendeeCount(liveClass) {
  if (liveClass.status !== 'live') {
    return liveClass.attendeeCount ?? 0;
  }

  const provider = getStreamingProvider();
  const count = await provider.getParticipantCount(liveClass.streamingRoomId);
  liveClass.attendeeCount = count;
  await liveClass.save();
  return count;
}

export async function listLiveClasses(userId, query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 20, maxLimit: 50 });
  const now = new Date();
  const filter = {
    $or: [
      { status: 'live' },
      { status: 'scheduled', scheduledAt: { $gte: now } },
    ],
  };

  const [classes, total, reminders] = await Promise.all([
    LiveClass.find(filter)
      .sort({ status: -1, scheduledAt: 1 })
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
  const provider = getStreamingProvider();
  const instructorUser = data.instructorId
    ? await User.findById(data.instructorId).select('name role').lean()
    : null;

  const instructorName = data.instructor ?? instructorUser?.name ?? 'Sopaan Faculty';
  const streamingRoomId = buildRoomId(data.title);

  if (provider.isConfigured()) {
    await provider.createRoom({
      roomName: streamingRoomId,
      metadata: { title: data.title, examTag: data.examTag },
    });
  }

  const liveClass = await LiveClass.create({
    title: data.title,
    description: data.description,
    instructor: instructorName,
    instructorId: instructorUser?._id ?? userId,
    examTag: data.examTag,
    scheduledAt: data.scheduledAt,
    durationMin: data.durationMin,
    thumbnailColor: data.thumbnailColor,
    status: data.status ?? 'scheduled',
    streamingRoomId,
    streamingProvider: provider.id,
    startedAt: data.status === 'live' ? new Date() : undefined,
    createdBy: userId,
  });

  return formatLiveClass(liveClass.toObject());
}

export async function updateLiveClassStatus(userId, id, status) {
  const liveClass = await LiveClass.findById(id);

  if (!liveClass) {
    throw new AppError('Live class not found', 404, 'NOT_FOUND');
  }

  if (status === 'live' && liveClass.status === 'scheduled') {
    liveClass.status = 'live';
    liveClass.startedAt = new Date();
  } else if (status === 'ended' && liveClass.status !== 'ended') {
    liveClass.status = 'ended';
    liveClass.endedAt = new Date();

    const provider = getStreamingProvider();
    if (provider.isConfigured() && typeof provider.finalizeRecording === 'function') {
      const recording = await provider.finalizeRecording({
        roomName: liveClass.streamingRoomId,
        liveClassId: liveClass._id.toString(),
      });

      if (recording?.recordingUrl) {
        liveClass.recordingUrl = recording.recordingUrl;
        liveClass.recordingStatus = recording.recordingStatus ?? 'ready';
      } else if (recording?.livekitEgressId) {
        liveClass.livekitEgressId = recording.livekitEgressId;
        liveClass.recordingStatus = recording.recordingStatus ?? 'pending';
      } else if (recording?.recordingStatus) {
        liveClass.recordingStatus = recording.recordingStatus;
      }
    }
  } else if (status === 'scheduled' && liveClass.status === 'live') {
    throw new AppError('Cannot revert a live class to scheduled', 400, 'INVALID_STATUS');
  } else {
    liveClass.status = status;
  }

  await liveClass.save();
  return formatLiveClass(liveClass.toObject());
}

export async function createLiveToken(userId, liveClassId) {
  const liveClass = await LiveClass.findById(liveClassId);

  if (!liveClass) {
    throw new AppError('Live class not found', 404, 'NOT_FOUND');
  }

  if (!isStreamingConfigured()) {
    throw new AppError('Live streaming is not configured', 503, 'STREAMING_NOT_CONFIGURED');
  }

  if (liveClass.status !== 'live') {
    throw new AppError('This class is not live yet', 400, 'NOT_LIVE');
  }

  const provider = getStreamingProvider();
  const user = await User.findById(userId).select('name role').lean();
  const host = isLiveClassHost(userId, liveClass, user);
  const credentials = host
    ? await provider.createHostToken({
        roomName: liveClass.streamingRoomId,
        identity: userId.toString(),
        name: user?.name ?? 'Educator',
      })
    : await provider.createViewerToken({
        roomName: liveClass.streamingRoomId,
        identity: userId.toString(),
        name: user?.name ?? 'Student',
      });

  await refreshAttendeeCount(liveClass);

  return {
    liveClassId: liveClass._id.toString(),
    roomName: liveClass.streamingRoomId,
    provider: credentials.provider,
    url: credentials.url,
    token: credentials.token,
    role: host ? 'host' : 'viewer',
    attendeeCount: liveClass.attendeeCount,
  };
}

export async function createViewerToken(userId, liveClassId) {
  const token = await createLiveToken(userId, liveClassId);
  return token;
}

export async function setLiveClassReminder(userId, liveClassId) {
  const liveClass = await LiveClass.findById(liveClassId).lean();

  if (!liveClass) {
    throw new AppError('Live class not found', 404, 'NOT_FOUND');
  }

  if (liveClass.status !== 'scheduled') {
    throw new AppError('Reminders are only available for scheduled classes', 400, 'INVALID_STATUS');
  }

  const remindAt = new Date(liveClass.scheduledAt);
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
