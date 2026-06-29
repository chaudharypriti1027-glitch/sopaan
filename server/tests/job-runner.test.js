import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { JobRun } from '../src/models/JobRun.js';
import { runIdempotentJob } from '../src/jobs/jobRunner.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

describe('job runner idempotency', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('runs a job once and skips subsequent calls for the same run key', async () => {
    let calls = 0;

    const first = await runIdempotentJob({
      jobName: 'test-job',
      runKey: '2026-06-26',
      handler: async () => {
        calls += 1;
        return { ok: true };
      },
    });

    const second = await runIdempotentJob({
      jobName: 'test-job',
      runKey: '2026-06-26',
      handler: async () => {
        calls += 1;
        return { ok: true };
      },
    });

    expect(first.skipped).toBe(false);
    expect(first.result).toEqual({ ok: true });
    expect(second.skipped).toBe(true);
    expect(second.reason).toBe('already_completed');
    expect(calls).toBe(1);

    const runs = await JobRun.find({ jobName: 'test-job' }).lean();
    expect(runs).toHaveLength(1);
    expect(runs[0].status).toBe('completed');
  });

  it('records failures and allows retry after force', async () => {
    await expect(
      runIdempotentJob({
        jobName: 'failing-job',
        runKey: '2026-06-26',
        handler: async () => {
          throw new Error('boom');
        },
      }),
    ).rejects.toThrow('boom');

    const failed = await JobRun.findOne({ jobName: 'failing-job' }).lean();
    expect(failed.status).toBe('failed');
    expect(failed.error).toBe('boom');

    let calls = 0;
    const retry = await runIdempotentJob({
      jobName: 'failing-job',
      runKey: '2026-06-26',
      force: true,
      handler: async () => {
        calls += 1;
        return { recovered: true };
      },
    });

    expect(retry.skipped).toBe(false);
    expect(retry.result).toEqual({ recovered: true });
    expect(calls).toBe(1);
  });
});
