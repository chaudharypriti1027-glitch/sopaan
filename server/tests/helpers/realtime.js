import { createServer } from 'http';
import app from '../../src/app.js';
import { initRealtimeServer, closeRealtimeServer } from '../../src/realtime/index.js';
import { LIVE_NS_EVENTS } from '../../src/realtime/liveEvents.js';

export async function startRealtimeTestServer() {
  const httpServer = createServer(app);
  initRealtimeServer(httpServer);

  await new Promise((resolve) => {
    httpServer.listen(0, resolve);
  });

  return {
    httpServer,
    port: httpServer.address().port,
  };
}

export async function stopRealtimeTestServer(httpServer) {
  await closeRealtimeServer();

  if (!httpServer?.listening) {
    return;
  }

  await new Promise((resolve, reject) => {
    httpServer.close((err) => {
      if (err && err.message !== 'Server is not running.') {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

export function waitForPresence(socket, classId, minCount = 2, timeoutMs = 8_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('presence timeout')), timeoutMs);

    const handler = (payload) => {
      if (payload.classId === classId && payload.count >= minCount) {
        clearTimeout(timer);
        socket.off(LIVE_NS_EVENTS.PRESENCE, handler);
        resolve(payload);
      }
    };

    socket.on(LIVE_NS_EVENTS.PRESENCE, handler);
  });
}

export function waitForSocketConnect(socket, timeoutMs = 12_000) {
  if (socket.connected) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('socket connect timeout')), timeoutMs);

    socket.once('connect', () => {
      clearTimeout(timer);
      resolve(undefined);
    });

    socket.once('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
