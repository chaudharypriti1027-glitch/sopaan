import { AccessToken, EgressClient, EncodedFileOutput, EncodedFileType, RoomServiceClient } from 'livekit-server-sdk';
import { env } from '../../config/env.js';
import { logger } from '../../observability/logger.js';

function requireLiveKitConfig() {
  if (!env.livekitApiKey || !env.livekitApiSecret || !env.livekitUrl) {
    return null;
  }

  return {
    apiKey: env.livekitApiKey,
    apiSecret: env.livekitApiSecret,
    url: env.livekitUrl,
  };
}

function httpHost(config) {
  return config.url.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
}

function roomClient(config) {
  return new RoomServiceClient(httpHost(config), config.apiKey, config.apiSecret);
}

function egressClient(config) {
  return new EgressClient(httpHost(config), config.apiKey, config.apiSecret);
}

function buildToken({ roomName, identity, name, canPublish }) {
  const config = requireLiveKitConfig();

  if (!config) {
    throw new Error('LiveKit is not configured');
  }

  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity,
    name,
    ttl: 60 * 60,
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe: true,
  });

  return token.toJwt();
}

export const livekitStreamingProvider = {
  id: 'livekit',

  isConfigured() {
    return Boolean(requireLiveKitConfig());
  },

  getConnectionUrl() {
    return requireLiveKitConfig()?.url ?? null;
  },

  async createRoom({ roomName, metadata }) {
    const config = requireLiveKitConfig();
    const client = roomClient(config);

    await client.createRoom({
      name: roomName,
      emptyTimeout: 10 * 60,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });

    return { roomName, provider: this.id };
  },

  async createViewerToken({ roomName, identity, name }) {
    return {
      token: buildToken({ roomName, identity, name, canPublish: false }),
      url: this.getConnectionUrl(),
      provider: this.id,
      role: 'viewer',
    };
  },

  async createHostToken({ roomName, identity, name }) {
    return {
      token: buildToken({ roomName, identity, name, canPublish: true }),
      url: this.getConnectionUrl(),
      provider: this.id,
      role: 'host',
    };
  },

  async getParticipantCount(roomName) {
    const config = requireLiveKitConfig();

    if (!config) {
      return 0;
    }

    try {
      const client = roomClient(config);
      const participants = await client.listParticipants(roomName);
      return participants.length;
    } catch {
      return 0;
    }
  },

  async finalizeRecording({ roomName, liveClassId }) {
    const config = requireLiveKitConfig();

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

    try {
      const client = egressClient(config);
      const info = await client.startRoomCompositeEgress(
        roomName,
        {
          file: new EncodedFileOutput({
            fileType: EncodedFileType.MP4,
            filepath: `live-classes/${liveClassId}/${roomName}.mp4`,
          }),
        },
        { layout: 'speaker' },
      );

      return {
        livekitEgressId: info.egressId,
        recordingStatus: 'pending',
      };
    } catch (err) {
      logger.warn('livekit recording egress failed', {
        liveClassId,
        roomName,
        error: err?.message ?? String(err),
      });

      return {
        recordingStatus: 'failed',
      };
    }
  },
};
