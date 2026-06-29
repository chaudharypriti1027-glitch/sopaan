import { Queue, Worker } from 'bullmq';
import { JOB_DEFINITIONS, jobConfig, JOB_NAMES } from '../config/jobConfig.js';
import { getBullMqConnection } from '../lib/redis.js';
import { logger } from '../observability/logger.js';
import { captureException } from '../observability/sentry.js';
import { getJobHandler } from './scheduler.js';

let queue = null;
let worker = null;

function shouldRegister(definition) {
  if (definition.requiresCaDigest && !jobConfig.caDigestEnabled) {
    return false;
  }

  return true;
}

async function registerRepeatableJobs(jobQueue) {
  for (const definition of JOB_DEFINITIONS) {
    if (!shouldRegister(definition)) {
      continue;
    }

    const pattern = jobConfig.schedules[definition.name];
    const handler = getJobHandler(definition.name);

    if (!handler) {
      continue;
    }

    await jobQueue.add(
      definition.name,
      {},
      {
        jobId: `repeat-${definition.name}`,
        repeat: {
          pattern,
          tz: jobConfig.timezone,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    logger.info('[jobs] bullmq repeatable job registered', {
      jobName: definition.name,
      pattern,
      timezone: jobConfig.timezone,
    });
  }
}

function attachWorkerFailureLogging(bullWorker) {
  bullWorker.on('failed', (job, err) => {
    logger.error('[jobs] bullmq job failed', {
      jobName: job?.name,
      message: err.message,
    });

    captureException(err, {
      tags: {
        source: 'bullmq',
        jobName: job?.name ?? 'unknown',
      },
      extra: {
        jobId: job?.id,
        attemptsMade: job?.attemptsMade,
      },
    });
  });
}

export async function startBullMqScheduler({
  registerRepeatables = true,
  startWorker = true,
} = {}) {
  const connection = getBullMqConnection();

  if (!connection || !jobConfig.enabled) {
    return null;
  }

  if (!registerRepeatables && !startWorker) {
    return null;
  }

  queue = new Queue('sopaan-jobs', { connection });

  if (registerRepeatables) {
    await registerRepeatableJobs(queue);
  }

  if (startWorker) {
    worker = new Worker(
      'sopaan-jobs',
      async (job) => {
        const handler = getJobHandler(job.name);

        if (!handler) {
          throw new Error(`Unknown BullMQ job: ${job.name}`);
        }

        return handler({ triggeredBy: 'bullmq' });
      },
      { connection },
    );

    attachWorkerFailureLogging(worker);
  }

  return { queue, worker };
}

export async function stopBullMqScheduler() {
  await worker?.close();
  await queue?.close();
  worker = null;
  queue = null;
}

export { JOB_NAMES };
