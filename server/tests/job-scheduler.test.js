import { describe, expect, it } from '@jest/globals';
import cron from 'node-cron';
import { JOB_DEFINITIONS, jobConfig } from '../src/config/jobConfig.js';

describe('job scheduler config', () => {
  it('defines valid cron expressions for all jobs', () => {
    for (const definition of JOB_DEFINITIONS) {
      const schedule = jobConfig.schedules[definition.name];
      expect(cron.validate(schedule)).toBe(true);
    }
  });

  it('uses expected default schedules', () => {
    expect(jobConfig.schedules['daily-plan']).toBe('0 6 * * *');
    expect(jobConfig.schedules['streak-reminder']).toBe('0 20 * * *');
    expect(jobConfig.schedules['ca-digest-notify']).toBe('0 7 * * *');
    expect(jobConfig.schedules['weekly-recap']).toBe('0 9 * * 1');
    expect(jobConfig.schedules['observability-spike-check']).toBe('*/5 * * * *');
    expect(jobConfig.schedules['daily-league-maintenance']).toBe('5 0 * * *');
  });
});
