import cron from 'node-cron';
import { JOB_DEFINITIONS, JOB_NAMES, jobConfig } from '../config/jobConfig.js';
import { runDailyPlanJob } from './handlers/dailyPlan.js';
import { runStreakReminderJob } from './handlers/streakReminder.js';
import { runCaDigestGenerateJob } from './handlers/caDigestGenerate.js';
import { runCaDigestNotifyJob } from './handlers/caDigestNotify.js';
import { runWeeklyRecapJob } from './handlers/weeklyRecap.js';
import { runObservabilitySpikeCheckJob } from './handlers/observabilitySpikeCheck.js';
import { runDailyLeagueMaintenanceJob } from './handlers/dailyLeagueMaintenance.js';
import { startBullMqScheduler, stopBullMqScheduler } from './bullmqScheduler.js';
import { getBullMqConnection } from '../lib/redis.js';
import { processConfig } from '../config/processConfig.js';

const JOB_HANDLERS = Object.freeze({
  [JOB_NAMES.DAILY_PLAN]: runDailyPlanJob,
  [JOB_NAMES.STREAK_REMINDER]: runStreakReminderJob,
  [JOB_NAMES.CA_DIGEST_GENERATE]: runCaDigestGenerateJob,
  [JOB_NAMES.CA_DIGEST_NOTIFY]: runCaDigestNotifyJob,
  [JOB_NAMES.WEEKLY_RECAP]: runWeeklyRecapJob,
  [JOB_NAMES.OBSERVABILITY_SPIKE_CHECK]: runObservabilitySpikeCheckJob,
  [JOB_NAMES.DAILY_LEAGUE_MAINTENANCE]: runDailyLeagueMaintenanceJob,
});

const scheduledTasks = [];

function wrapJob(jobName, handler) {
  return () => {
    handler().catch((err) => {
      console.error(`[jobs] scheduled run failed for ${jobName}:`, err.message);
    });
  };
}

function shouldRegister(definition) {
  if (definition.requiresCaDigest && !jobConfig.caDigestEnabled) {
    return false;
  }

  return true;
}

export function getJobHandler(jobName) {
  return JOB_HANDLERS[jobName] ?? null;
}

export function startJobScheduler() {
  if (!jobConfig.enabled) {
    console.info('[jobs] scheduler disabled (JOBS_ENABLED=false)');
    return [];
  }

  if (!processConfig.runsJobs) {
    console.info(`[jobs] skipped for PROCESS_ROLE=${processConfig.role}`);
    return [];
  }

  if (getBullMqConnection()) {
    startBullMqScheduler({
      registerRepeatables: processConfig.registersBullMqRepeatables,
      startWorker: processConfig.runsBullMqWorker,
    })
      .then((bull) => {
        if (bull) {
          const parts = [];
          if (processConfig.registersBullMqRepeatables) parts.push('repeatables');
          if (processConfig.runsBullMqWorker) parts.push('worker');
          console.info(`[jobs] BullMQ active (${parts.join(' + ') || 'queue only'})`);
        }
      })
      .catch((err) => {
        if (!processConfig.runsNodeCron) {
          console.error('[jobs] BullMQ startup failed:', err.message);
          return;
        }

        console.error('[jobs] BullMQ startup failed, falling back to node-cron:', err.message);
        startCronScheduler();
      });

    return scheduledTasks;
  }

  if (!processConfig.runsNodeCron) {
    console.warn('[jobs] Redis unavailable and PROCESS_ROLE cannot run node-cron fallback');
    return [];
  }

  return startCronScheduler();
}

function startCronScheduler() {
  console.info('[jobs] using node-cron scheduler (in-process fallback)');

  for (const definition of JOB_DEFINITIONS) {
    if (!shouldRegister(definition)) {
      console.info(`[jobs] skipping ${definition.name} (CA digest disabled)`);
      continue;
    }

    const schedule = jobConfig.schedules[definition.name];
    const handler = JOB_HANDLERS[definition.name];

    if (!handler) {
      console.warn(`[jobs] no handler registered for ${definition.name}`);
      continue;
    }

    if (!cron.validate(schedule)) {
      console.error(`[jobs] invalid cron for ${definition.name}: ${schedule}`);
      continue;
    }

    const task = cron.schedule(schedule, wrapJob(definition.name, handler), {
      timezone: jobConfig.timezone,
    });

    scheduledTasks.push(task);
    console.info(
      `[jobs] registered ${definition.name} schedule="${schedule}" timezone="${jobConfig.timezone}"`,
    );
  }

  return scheduledTasks;
}

export function stopJobScheduler() {
  stopBullMqScheduler().catch((err) => {
    console.warn('[jobs] BullMQ shutdown warning:', err.message);
  });

  for (const task of scheduledTasks) {
    task.stop();
  }

  scheduledTasks.length = 0;
}

export async function triggerJob(jobName, { force = false, date, triggeredBy = 'manual' } = {}) {
  const handler = getJobHandler(jobName);

  if (!handler) {
    throw new Error(`Unknown job: ${jobName}`);
  }

  return handler({ force, date, triggeredBy });
}

export { JOB_DEFINITIONS, JOB_HANDLERS };
