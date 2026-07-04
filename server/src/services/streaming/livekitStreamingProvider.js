import * as livekit from '../livekit.js';

export const livekitStreamingProvider = {
  id: 'livekit',

  isConfigured() {
    return livekit.isLiveKitConfigured();
  },

  getConnectionUrl() {
    return livekit.getLiveKitUrl();
  },

  async createRoom({ roomName, metadata }) {
    await livekit.createRoom({ roomName, metadata });
    return { roomName, provider: this.id };
  },

  async createViewerToken({ roomName, identity, name }) {
    const credentials = await livekit.mintRoomToken({
      roomName,
      identity,
      name,
      role: 'student',
    });

    return {
      ...credentials,
      provider: this.id,
    };
  },

  async createHostToken({ roomName, identity, name }) {
    const credentials = await livekit.mintRoomToken({
      roomName,
      identity,
      name,
      role: 'host',
    });

    return {
      ...credentials,
      provider: this.id,
    };
  },

  async getParticipantCount(roomName) {
    return livekit.getParticipantCount(roomName);
  },

  async startRecording({ roomName, liveClassId }) {
    return livekit.startRoomRecording({ roomName, liveClassId });
  },

  async stopRecording({ egressId, roomName, liveClassId }) {
    return livekit.stopRoomRecording({ egressId, roomName, liveClassId });
  },

  /** @deprecated use startRecording on class start */
  async finalizeRecording({ roomName, liveClassId }) {
    return livekit.startRoomRecording({ roomName, liveClassId });
  },
};
