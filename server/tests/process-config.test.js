import { describe, expect, it } from '@jest/globals';
import { resolveProcessConfig } from '../src/config/processConfig.js';

describe('processConfig', () => {
  it('defaults to all-in-one local role', () => {
    const config = resolveProcessConfig(undefined);

    expect(config.role).toBe('all');
    expect(config.runsHttp).toBe(true);
    expect(config.runsBullMqWorker).toBe(true);
  });

  it('api role serves HTTP without running jobs', () => {
    const config = resolveProcessConfig('api');

    expect(config.runsHttp).toBe(true);
    expect(config.runsJobs).toBe(false);
    expect(config.runsBullMqWorker).toBe(false);
  });

  it('worker role runs BullMQ without HTTP', () => {
    const config = resolveProcessConfig('worker');

    expect(config.runsHttp).toBe(false);
    expect(config.runsJobs).toBe(true);
    expect(config.runsBullMqWorker).toBe(true);
    expect(config.registersBullMqRepeatables).toBe(true);
  });

  it('scheduler registers repeatables without running the worker', () => {
    const config = resolveProcessConfig('scheduler');

    expect(config.runsHttp).toBe(false);
    expect(config.registersBullMqRepeatables).toBe(true);
    expect(config.runsBullMqWorker).toBe(false);
  });
});
