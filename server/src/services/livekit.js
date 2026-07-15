import {
  AccessToken,
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  RoomServiceClient,
  S3Upload,
  WebhookReceiver,
} from 'livekit-server-sdk';
import { env } from '../config/env.js';
import { logger } from '../observability/logger.js';
import { AppError } from '../utils/AppError.js';
import { buildPublicUrl } from './media/mediaObjectStorage.js';

function streamingNotConfigured() {
  return new AppError('Live streaming is not configured', 503, 'STREAMING_NOT_CONFIGURED');
}

const TOKEN_TTL_SEC = 60 * 60;

function getConfig() {
  if (!env.livekitApiKey || !env.livekitApiSecret || !env.livekitUrl) {
    return null;
  }

  return {
    apiKey: env.livekitApiKey,
    apiSecret: env.livekitApiSecret,
    url: env.livekitUrl,
    httpUrl: env.livekitHttpUrl,
  };
}

function httpHost(config) {
  return (config.httpUrl || config.url)
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://')
    .replace(/\/$/, '');
}

export function isS3RecordingConfigured() {
  return Boolean(env.s3Bucket && env.s3AccessKey && env.s3SecretKey);
}

function buildS3Upload() {
  if (!env.livekitEgressEnabled || !isS3RecordingConfigured()) {
    return null;
  }

  return new S3Upload({
    accessKey: env.s3AccessKey,
    secret: env.s3SecretKey,
    bucket: env.s3Bucket,
    region: env.s3Region || 'auto',
    endpoint: env.s3Endpoint || '',
  });
}

export function isLiveKitConfigured() {
  return Boolean(getConfig());
}

export async function verifyLiveKitApiAccess() {
  const config = getConfig();

  if (!config) {
    return false;
  }

  try {
    const client = new RoomServiceClient(httpHost(config), config.apiKey, config.apiSecret);
    await client.listRooms();
    return true;
  } catch (err) {
    logger.warn('livekit api verification failed', {
      error: err?.message ?? String(err),
    });
    return false;
  }
}

export function getLiveKitUrl() {
  return getConfig()?.url ?? null;
}

export function buildRecordingFilepath({ roomName, liveClassId }) {
  return `live-classes/${liveClassId}/${roomName}.mp4`;
}

export function buildRecordingUrl({ roomName, liveClassId, filepath }) {
  const baseUrl = env.livekitRecordingBaseUrl?.replace(/\/$/, '');

  if (baseUrl) {
    return `${baseUrl}/${roomName}.mp4`;
  }

  const key = filepath ?? buildRecordingFilepath({ roomName, liveClassId });
  return buildPublicUrl(key);
}

/**
 * @param {'host' | 'student'} role
 */
export async function mintRoomToken({ identity, name, roomName, role }) {
  const config = getConfig();

  if (!config) {
    throw streamingNotConfigured();
  }

  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity,
    name,
    ttl: TOKEN_TTL_SEC,
  });

  const isHost = role === 'host';

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: isHost,
    canSubscribe: true,
    canPublishData: true,
  });

  return {
    token: await token.toJwt(),
    url: config.url,
    role,
    canPublish: isHost,
    canSubscribe: true,
    canPublishData: true,
  };
}

export async function createRoom({ roomName, metadata }) {
  const config = getConfig();
  const client = new RoomServiceClient(httpHost(config), config.apiKey, config.apiSecret);

  await client.createRoom({
    name: roomName,
    emptyTimeout: 10 * 60,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
  });

  return { roomName };
}

export async function getParticipantCount(roomName) {
  const config = getConfig();

  if (!config) {
    return 0;
  }

  try {
    const client = new RoomServiceClient(httpHost(config), config.apiKey, config.apiSecret);
    const participants = await client.listParticipants(roomName);
    return participants.length;
  } catch {
    return 0;
  }
}

export async function startRoomRecording({ roomName, liveClassId }) {
  const config = getConfig();

  if (!config) {
    return null;
  }

  const baseUrl = env.livekitRecordingBaseUrl?.replace(/\/$/, '');

  if (baseUrl) {
    return {
      egressId: null,
      recordingUrl: `${baseUrl}/${roomName}.mp4`,
      recordingStatus: 'ready',
    };
  }

  if (!env.livekitEgressEnabled || !isS3RecordingConfigured()) {
    logger.warn('livekit egress skipped — S3 or LIVEKIT_EGRESS_ENABLED not configured', {
      liveClassId,
      roomName,
    });
    return {
      recordingStatus: 'failed',
    };
  }

  try {
    const client = new EgressClient(httpHost(config), config.apiKey, config.apiSecret);
    const filepath = buildRecordingFilepath({ roomName, liveClassId });
    const s3 = buildS3Upload();
    const fileOutput = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath,
      ...(s3 ? { s3 } : {}),
    });

    const info = await client.startRoomCompositeEgress(roomName, { file: fileOutput }, { layout: 'speaker' });

    return {
      egressId: info.egressId,
      recordingStatus: 'pending',
    };
  } catch (err) {
    logger.warn('livekit egress start failed', {
      liveClassId,
      roomName,
      error: err?.message ?? String(err),
    });

    return {
      recordingStatus: 'failed',
    };
  }
}

export async function stopRoomRecording({ egressId, roomName, liveClassId: _liveClassId }) {
  const config = getConfig();

  if (!config) {
    return null;
  }

  const baseUrl = env.livekitRecordingBaseUrl?.replace(/\/$/, '');

  if (baseUrl) {
    return {
      recordingUrl: `${baseUrl}/${roomName}.mp4`,
      recordingStatus: 'ready',
    };
  }

  if (!egressId) {
    return {
      recordingStatus: 'pending',
    };
  }

  try {
    const client = new EgressClient(httpHost(config), config.apiKey, config.apiSecret);
    await client.stopEgress(egressId);

    return {
      recordingStatus: 'pending',
    };
  } catch (err) {
    logger.warn('livekit egress stop failed', {
      egressId,
      roomName,
      error: err?.message ?? String(err),
    });

    return {
      recordingStatus: 'failed',
    };
  }
}

export function createWebhookReceiver() {
  const config = getConfig();

  if (!config) {
    return null;
  }

  return new WebhookReceiver(config.apiKey, config.apiSecret);
}

export async function verifyLiveKitWebhook(rawBody, authHeader, { skipAuth = false } = {}) {
  const receiver = createWebhookReceiver();

  if (!receiver) {
    throw streamingNotConfigured();
  }

  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  return receiver.receive(body, authHeader, skipAuth);
}

export function extractRecordingFromEgressInfo(egressInfo) {
  if (!egressInfo) {
    return { recordingUrl: null, recordingDurationSec: null };
  }

  const fileResults = egressInfo.fileResults ?? egressInfo.file_results ?? [];

  if (fileResults.length > 0) {
    const file = fileResults[0];
    const recordingUrl =
      file.location ||
      (file.filename ? buildPublicUrl(file.filename) : null) ||
      (file.filepath ? buildPublicUrl(file.filepath) : null);
    const durationNs = file.duration ?? file.durationNs ?? file.duration_ns ?? 0;
    const recordingDurationSec =
      durationNs > 0 ? Math.max(1, Math.round(Number(durationNs) / 1_000_000_000)) : null;

    return { recordingUrl, recordingDurationSec };
  }

  const legacyFile = egressInfo.result?.file ?? egressInfo.file;
  if (legacyFile) {
    const recordingUrl =
      legacyFile.location ||
      (legacyFile.filename ? buildPublicUrl(legacyFile.filename) : null) ||
      (legacyFile.filepath ? buildPublicUrl(legacyFile.filepath) : null);
    const durationNs = legacyFile.duration ?? 0;
    const recordingDurationSec =
      durationNs > 0 ? Math.max(1, Math.round(Number(durationNs) / 1_000_000_000)) : null;

    return { recordingUrl, recordingDurationSec };
  }

  return { recordingUrl: null, recordingDurationSec: null };
}
