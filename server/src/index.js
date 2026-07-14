import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, registerDatabaseShutdownHandlers } from './config/db.js';
import { ensurePlatformSettings } from './services/platformSettingsService.js';
import { ensureAdminUser, ensureDevStudentUser } from './seed/seedDatabase.js';
import { getSeedAdminUser } from './seed/adminConfig.js';
import { seedE2eStudentUser } from './seed/data.js';
import { livekitStreamingProvider } from './services/streaming/livekitStreamingProvider.js';
import { initStreamingProvider } from './services/streaming/index.js';
import { initRealtimeServer, closeRealtimeServer } from './realtime/index.js';
import { startJobScheduler, stopJobScheduler } from './jobs/index.js';
import { initSentry, installProcessErrorHandlers } from './observability/sentry.js';
import { connectRedis, disconnectRedis } from './lib/redis.js';
import { processConfig } from './config/processConfig.js';

initSentry();
installProcessErrorHandlers();

if (!processConfig.runsHttp) {
  console.error(
    `PROCESS_ROLE=${processConfig.role} does not serve HTTP. Start src/worker.js for job workers.`,
  );
  process.exit(1);
}

function listen(httpServer, port) {
  const host = env.isDevelopment ? '0.0.0.0' : '127.0.0.1';

  return new Promise((resolve, reject) => {
    const onError = (err) => {
      httpServer.off('listening', onListening);
      reject(err);
    };
    const onListening = () => {
      httpServer.off('error', onError);
      resolve();
    };
    httpServer.once('error', onError);
    httpServer.once('listening', onListening);
    httpServer.listen({ port, host, exclusive: false });
  });
}

async function listenWithRetry(httpServer, port, { retries = 5, delayMs = 1000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await listen(httpServer, port);
      return;
    } catch (err) {
      const isPortInUse = err?.code === 'EADDRINUSE';
      const canRetry = env.nodeEnv === 'development' && isPortInUse && attempt < retries;

      if (canRetry) {
        console.warn(
          `[server] port ${port} still in use — retrying in ${delayMs}ms (${attempt}/${retries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      if (isPortInUse) {
        throw new Error(
          `Port ${port} is already in use. Stop the other process (lsof -i :${port}) or set PORT in .env.`,
        );
      }

      throw err;
    }
  }
}

async function start() {
  await connectDatabase();
  await ensurePlatformSettings();

  if (env.isDevelopment && process.env.SEED_ADMIN_EMAIL?.trim()) {
    await ensureAdminUser();
    console.log(`[dev] Admin account ready: ${getSeedAdminUser().email}`);
  }

  if (env.isDevelopment && !env.isTest) {
    await ensureDevStudentUser();
    console.log(`[dev] Student app login: ${seedE2eStudentUser.email} / ${seedE2eStudentUser.password}`);
  }

  if (
    env.isDevelopment &&
    !env.isTest &&
    env.streamingProvider === 'livekit' &&
    !livekitStreamingProvider.isConfigured()
  ) {
    console.warn(
      '[streaming] LIVEKIT_API_SECRET is missing — using dev streaming. Copy the secret from https://cloud.livekit.io → Project Settings → Keys, add to server/.env, restart API.',
    );
  }

  await initStreamingProvider();

  if (env.nodeEnv !== 'test') {
    await connectRedis().catch((err) => {
      console.warn('[redis] connection failed — using in-memory fallbacks:', err.message);
    });
    startJobScheduler();
  }

  const httpServer = createServer(app);

  if (env.nodeEnv !== 'test') {
    initRealtimeServer(httpServer);
  }

  await listenWithRetry(httpServer, env.port, {
    retries: env.isDevelopment ? 12 : 5,
    delayMs: 1000,
  });
  console.log(`Sopaan API listening on http://localhost:${env.port} [${env.nodeEnv}]`);
  if (env.isDevelopment) {
    console.log(`[dev] LAN devices: use http://<your-ip>:${env.port}/api (e.g. Expo Go on phone)`);
  }

  registerDatabaseShutdownHandlers(async () => {
    stopJobScheduler();

    await new Promise((resolve) => {
      if (typeof httpServer.closeAllConnections === 'function') {
        httpServer.closeAllConnections();
      }
      if (typeof httpServer.closeIdleConnections === 'function') {
        httpServer.closeIdleConnections();
      }

      httpServer.close(() => resolve());
      if (env.isDevelopment) {
        setTimeout(resolve, 200);
      }
    });

    await Promise.allSettled([closeRealtimeServer(), disconnectRedis()]);
    console.log('HTTP server closed');
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
