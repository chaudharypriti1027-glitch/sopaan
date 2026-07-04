import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '../api/storage';
import { getSocketOrigin } from './socketOrigin';

let liveSocket: Socket | null = null;
let liveSocketOrigin: string | null = null;

export function getLiveSocket() {
  return liveSocket;
}

export function isLiveSocketConnected() {
  return Boolean(liveSocket?.connected);
}

function resetLiveSocket() {
  if (liveSocket) {
    liveSocket.removeAllListeners();
    liveSocket.disconnect();
    liveSocket = null;
  }
}

export function connectAdminLiveSocket() {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  const origin = getSocketOrigin();
  if (liveSocket && liveSocketOrigin !== origin) {
    resetLiveSocket();
  }

  if (liveSocket?.connected) {
    return liveSocket;
  }

  if (liveSocket) {
    liveSocket.auth = { token };
    liveSocket.connect();
    return liveSocket;
  }

  liveSocketOrigin = origin;
  liveSocket = io(`${origin}/live`, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
  });

  return liveSocket;
}

export function disconnectAdminLiveSocket() {
  resetLiveSocket();
  liveSocketOrigin = null;
}
