import { Queue, Worker } from 'bullmq';
import { JOB_DEFINITIONS, jobConfig, JOB_NAMES } from '../config/jobConfig.js';
import { getBullMqConnection } from '../lib/redis.js';
import { logger } from '../observability/logger.js';
import { captureException } from '../observability/sentry.js';
import { getJobHandler } from './scheduler.js';
import { BookGenJob } from '../models/BookGenJob.js';

let queue = null;
let worker = null;

function shouldRegister(definition) {
  if (definition.requiresCaDigest && !jobConfig.caDigestEnabled) {
    return false;
  }

  return true;
}

export function getOrCreateJobQueue() {
  const connection = getBullMqConnection();

  if (!connection || !jobConfig.enabled) {
    return null;
  }

  if (!queue) {
    queue = new Queue('sopaan-jobs', { connection });
  }

  return queue;
}

export async function enqueueJob(jobName, data = {}, options = {}) {
  const jobQueue = getOrCreateJobQueue();

  if (!jobQueue) {
    return null;
  }

  return jobQueue.add(jobName, data, {
    removeOnComplete: 100,
    removeOnFail: 50,
    ...options,
  });
}

export async function enqueueManualJob(jobName, { force = false } = {}) {
  const jobQueue = getOrCreateJobQueue();

  if (!jobQueue) {
    return null;
  }

  return jobQueue.add(
    jobName,
    { force, triggeredBy: 'manual' },
    {
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );
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
      }
    );

    logger.info('[jobs] bullmq repeatable job registered', {
      jobName: definition.name,
      pattern,
      timezone: jobConfig.timezone,
    });
  }
}

function attachWorkerFailureLogging(bullWorker) {
  bullWorker.on('failed', async (job, err) => {
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

    if (job?.name === JOB_NAMES.BOOK_GEN && job.data?.jobId) {
      const maxAttempts = job.opts?.attempts ?? 1;
      const willRetry = job.attemptsMade < maxAttempts;
      await BookGenJob.findByIdAndUpdate(job.data.jobId, {
        state: willRetry ? 'queued' : 'failed',
        error: willRetry
          ? `Generation attempt ${job.attemptsMade} failed; retry scheduled`
          : 'Book generation worker failed after all retries',
      }).catch((statusError) => {
        logger.error('[jobs] failed to persist book generation failure', {
          jobId: job.data.jobId,
          message: statusError.message,
        });
      });
    }
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

  const jobQueue = getOrCreateJobQueue();

  if (registerRepeatables) {
    await registerRepeatableJobs(jobQueue);
  }

  if (startWorker) {
    worker = new Worker(
      'sopaan-jobs',
      async (job) => {
        const handler = getJobHandler(job.name);

        if (!handler) {
          throw new Error(`Unknown BullMQ job: ${job.name}`);
        }

        const data = job.data ?? {};

        return handler({
          force: data.force ?? false,
          date: data.date,
          triggeredBy: data.triggeredBy ?? 'scheduler',
          data,
        });
      },
      { connection }
    );

    attachWorkerFailureLogging(worker);
  }

  return { queue: jobQueue, worker };
}

export async function stopBullMqScheduler() {
  await worker?.close();
  await queue?.close();
  worker = null;
  queue = null;
}

export { JOB_NAMES };
