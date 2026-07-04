/**
 * Local development streaming — enables live class flow (tokens, chat, admin go-live)
 * without LiveKit credentials. Video is a placeholder in the mobile app.
 */

const rooms = new Map();

function ensureRoom(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, { participants: new Set(), createdAt: Date.now() });
  }
  return rooms.get(roomName);
}

function buildToken(kind, roomName, identity, name) {
  const payload = Buffer.from(
    JSON.stringify({ kind, roomName, identity, name, ts: Date.now() }),
  ).toString('base64url');

  return `dev-${kind}.${payload}`;
}

export const devStreamingProvider = {
  id: 'dev',

  isConfigured() {
    return true;
  },

  getConnectionUrl() {
    return 'dev://local-live';
  },

  async createRoom({ roomName }) {
    ensureRoom(roomName);
    return { roomName, provider: 'dev' };
  },

  async createViewerToken({ roomName, identity, name }) {
    const room = ensureRoom(roomName);
    room.participants.add(identity);

    return {
      token: buildToken('viewer', roomName, identity, name),
      url: this.getConnectionUrl(),
      provider: 'dev',
      roomName,
      identity,
      name,
      role: 'student',
      canPublish: false,
      canSubscribe: true,
      canPublishData: true,
    };
  },

  async createHostToken({ roomName, identity, name }) {
    const room = ensureRoom(roomName);
    room.participants.add(identity);

    return {
      token: buildToken('host', roomName, identity, name),
      url: this.getConnectionUrl(),
      provider: 'dev',
      roomName,
      identity,
      name,
      role: 'host',
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };
  },

  async getParticipantCount(roomName) {
    return rooms.get(roomName)?.participants.size ?? 0;
  },

  async finalizeRecording({ roomName }) {
    return {
      recordingUrl: `https://dev.local/recordings/${encodeURIComponent(roomName)}.mp4`,
      recordingStatus: 'ready',
    };
  },
};

export function resetDevStreamingRoomsForTests() {
  rooms.clear();
}
