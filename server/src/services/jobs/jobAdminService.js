import { JobRun } from '../../models/JobRun.js';
import { JOB_DEFINITIONS, jobConfig } from '../../config/jobConfig.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';

export async function listJobDefinitions() {
  const latestRuns = await JobRun.aggregate([
    { $sort: { startedAt: -1 } },
    {
      $group: {
        _id: '$jobName',
        lastRun: { $first: '$$ROOT' },
      },
    },
  ]);

  const lastRunByJob = new Map(latestRuns.map((entry) => [entry._id, entry.lastRun]));

  return JOB_DEFINITIONS.filter((definition) => {
    if (definition.requiresCaDigest && !jobConfig.caDigestEnabled) {
      return false;
    }

    return true;
  }).map((definition) => {
    const lastRun = lastRunByJob.get(definition.name);

    return {
      name: definition.name,
      description: definition.description,
      schedule: jobConfig.schedules[definition.name],
      scheduleEnv: definition.scheduleEnv,
      defaultSchedule: definition.defaultSchedule,
      period: definition.period,
      timezone: jobConfig.timezone,
      enabled: jobConfig.enabled,
      status: lastRun?.status ?? 'never_run',
      lastRun: lastRun
        ? {
            id: lastRun._id.toString(),
            runKey: lastRun.runKey,
            status: lastRun.status,
            attempt: lastRun.attempt,
            startedAt: lastRun.startedAt,
            completedAt: lastRun.completedAt,
            triggeredBy: lastRun.triggeredBy,
            error: lastRun.error,
            result: lastRun.result,
          }
        : null,
    };
  });
}

export async function listJobRuns(query) {
  const { limit, offset } = parsePagination(query);
  const filters = {};

  if (query.jobName) {
    filters.jobName = query.jobName;
  }

  if (query.status) {
    filters.status = query.status;
  }

  const [items, total] = await Promise.all([
    JobRun.find(filters).sort({ startedAt: -1 }).skip(offset).limit(limit).lean(),
    JobRun.countDocuments(filters),
  ]);

  return buildPaginatedResult({
    items: items.map((run) => ({
      id: run._id.toString(),
      jobName: run.jobName,
      runKey: run.runKey,
      status: run.status,
      attempt: run.attempt,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      triggeredBy: run.triggeredBy,
      error: run.error,
      result: run.result,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    })),
    total,
    limit,
    offset,
  });
}

export async function getJobRunById(runId) {
  const run = await JobRun.findById(runId).lean();

  if (!run) {
    return null;
  }

  return {
    id: run._id.toString(),
    jobName: run.jobName,
    runKey: run.runKey,
    status: run.status,
    attempt: run.attempt,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    triggeredBy: run.triggeredBy,
    error: run.error,
    result: run.result,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}
