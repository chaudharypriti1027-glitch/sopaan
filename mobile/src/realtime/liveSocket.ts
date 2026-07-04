import { io, type Socket } from 'socket.io-client';
import { config } from '../config/env';

type TokenProvider = () => Promise<string | null>;

let liveSocket: Socket | null = null;

const LIVE_TRANSPORTS = ['polling', 'websocket'] as const;

export function getLiveSocket() {
  return liveSocket;
}

export function isLiveSocketConnected() {
  return Boolean(liveSocket?.connected);
}

export async function connectLiveSocket(getToken: TokenProvider) {
  const token = await getToken();

  if (!token) {
    return null;
  }

  if (liveSocket?.connected) {
    return liveSocket;
  }

  if (liveSocket) {
    liveSocket.auth = { token };
    liveSocket.connect();
    return liveSocket;
  }

  liveSocket = io(`${config.apiOrigin}/live`, {
    path: '/socket.io',
    transports: [...LIVE_TRANSPORTS],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 12,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 20_000,
  });

  return liveSocket;
}

export function disconnectLiveSocket() {
  liveSocket?.removeAllListeners();
  liveSocket?.disconnect();
  liveSocket = null;
}
