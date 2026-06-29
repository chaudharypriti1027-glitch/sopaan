import { JobRun } from '../models/JobRun.js';
import { jobConfig } from '../config/jobConfig.js';

export async function runIdempotentJob({
  jobName,
  runKey,
  handler,
  triggeredBy = 'scheduler',
  force = false,
  staleAfterMs = jobConfig.staleRunningMs,
}) {
  if (!force) {
    const existing = await JobRun.findOne({ jobName, runKey }).lean();

    if (existing?.status === 'completed') {
      return {
        skipped: true,
        reason: 'already_completed',
        jobRunId: existing._id.toString(),
        result: existing.result,
      };
    }

    const isStaleRunning =
      existing?.status === 'running' &&
      Date.now() - new Date(existing.startedAt).getTime() > staleAfterMs;

    if (existing?.status === 'running' && !isStaleRunning) {
      return {
        skipped: true,
        reason: 'already_running',
        jobRunId: existing._id.toString(),
      };
    }
  } else {
    await JobRun.deleteOne({ jobName, runKey });
  }

  const runDoc = await JobRun.findOneAndUpdate(
    { jobName, runKey },
    {
      $set: {
        status: 'running',
        startedAt: new Date(),
        completedAt: null,
        error: null,
        result: null,
        triggeredBy,
      },
      $inc: { attempt: 1 },
      $setOnInsert: { jobName, runKey },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  try {
    const result = await handler();
    runDoc.status = 'completed';
    runDoc.completedAt = new Date();
    runDoc.result = result ?? null;
    await runDoc.save();

    console.info(`[jobs] ${jobName} (${runKey}) completed`, result ?? '');

    return {
      skipped: false,
      jobRunId: runDoc._id.toString(),
      result,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    runDoc.status = 'failed';
    runDoc.completedAt = new Date();
    runDoc.error = message;
    await runDoc.save();

    console.error(`[jobs] ${jobName} (${runKey}) failed:`, message);
    throw err;
  }
}
