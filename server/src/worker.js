import { connectDatabase, registerDatabaseShutdownHandlers } from './config/db.js';
import { env } from './config/env.js';
import { processConfig } from './config/processConfig.js';
import { startJobScheduler, stopJobScheduler } from './jobs/index.js';
import { initSentry, installProcessErrorHandlers } from './observability/sentry.js';
import { connectRedis, disconnectRedis } from './lib/redis.js';

initSentry();
installProcessErrorHandlers();

if (processConfig.runsHttp || !processConfig.runsJobs) {
  console.error(
    `worker.js requires PROCESS_ROLE=worker or scheduler (current: ${processConfig.role})`,
  );
  process.exit(1);
}

async function start() {
  await connectDatabase();

  await connectRedis().catch((err) => {
    console.error('[worker] Redis connection failed:', err.message);
    process.exit(1);
  });

  startJobScheduler();

  registerDatabaseShutdownHandlers(async () => {
    stopJobScheduler();
    await disconnectRedis().catch(() => {});
    console.log('[worker] shutdown complete');
  });

  console.log(`Sopaan job worker running [${env.nodeEnv}] role=${processConfig.role}`);
}

start().catch((err) => {
  console.error('Failed to start worker:', err.message);
  process.exit(1);
});
