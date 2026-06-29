/**
 * Process role for container orchestration.
 *
 * - all:       HTTP API + BullMQ scheduler/worker (local dev, single-container deploy)
 * - api:       HTTP only — no cron/BullMQ (scale horizontally)
 * - worker:    BullMQ repeatables + worker — no HTTP (scale job throughput)
 * - scheduler: Register BullMQ repeatable jobs only — no HTTP, no worker
 */
const VALID_ROLES = new Set(['all', 'api', 'worker', 'scheduler']);

export function resolveProcessConfig(roleInput = process.env.PROCESS_ROLE) {
  const role = (roleInput?.trim().toLowerCase() || 'all');

  if (!VALID_ROLES.has(role)) {
    throw new Error(
      `Invalid PROCESS_ROLE="${roleInput}". Expected one of: ${[...VALID_ROLES].join(', ')}`,
    );
  }

  return Object.freeze({
    role,
    runsHttp: role === 'all' || role === 'api',
    runsJobs: role === 'all' || role === 'worker' || role === 'scheduler',
    registersBullMqRepeatables: role === 'all' || role === 'worker' || role === 'scheduler',
    runsBullMqWorker: role === 'all' || role === 'worker',
    runsNodeCron: role === 'all' || role === 'worker',
  });
}

export const processConfig = resolveProcessConfig();
