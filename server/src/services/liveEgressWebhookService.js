import { LiveClass } from '../models/LiveClass.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../observability/logger.js';
import {
  extractRecordingFromEgressInfo,
  verifyLiveKitWebhook,
} from './livekit.js';

function resolveRoomName(egressInfo) {
  return egressInfo?.roomName ?? egressInfo?.room_name ?? null;
}

function resolveEgressId(egressInfo) {
  return egressInfo?.egressId ?? egressInfo?.egress_id ?? null;
}

async function findLiveClassForEgress(egressInfo) {
  const egressId = resolveEgressId(egressInfo);
  const roomName = resolveRoomName(egressInfo);

  const or = [];

  if (egressId) {
    or.push({ egressId }, { livekitEgressId: egressId });
  }

  if (roomName) {
    or.push({ roomName }, { streamingRoomId: roomName });
  }

  if (or.length === 0) {
    return null;
  }

  return LiveClass.findOne({ $or: or }).sort({ updatedAt: -1 });
}

export async function processEgressEnded(egressInfo) {
  const liveClass = await findLiveClassForEgress(egressInfo);

  if (!liveClass) {
    logger.warn('live egress webhook: no matching live class', {
      egressId: resolveEgressId(egressInfo),
      roomName: resolveRoomName(egressInfo),
    });
    return { ok: true, matched: false };
  }

  const { recordingUrl, recordingDurationSec } = extractRecordingFromEgressInfo(egressInfo);

  if (recordingUrl) {
    liveClass.recordingUrl = recordingUrl;
    liveClass.recordingStatus = 'ready';
  } else if (liveClass.recordingStatus !== 'ready') {
    liveClass.recordingStatus = 'failed';
  }

  if (recordingDurationSec != null) {
    liveClass.recordingDurationSec = recordingDurationSec;
  }

  if (liveClass.status === 'live') {
    liveClass.status = 'ended';
    liveClass.endedAt = liveClass.endedAt ?? new Date();
  }

  await liveClass.save();

  logger.info('live egress recording finalized', {
    liveClassId: liveClass._id.toString(),
    egressId: resolveEgressId(egressInfo),
    recordingUrl: liveClass.recordingUrl ?? null,
  });

  return {
    ok: true,
    matched: true,
    liveClassId: liveClass._id.toString(),
    recordingUrl: liveClass.recordingUrl ?? null,
  };
}

export async function handleLiveEgressWebhook(rawBody, authHeader, { skipAuth = false } = {}) {
  let event;

  try {
    event = await verifyLiveKitWebhook(rawBody, authHeader, { skipAuth });
  } catch (err) {
    throw new AppError(err?.message ?? 'Invalid LiveKit webhook signature', 401, 'UNAUTHORIZED');
  }

  const eventName = event.event ?? event.type;

  if (eventName !== 'egress_ended') {
    return { ok: true, ignored: true, event: eventName };
  }

  return processEgressEnded(event.egressInfo ?? event.egress_info);
}
