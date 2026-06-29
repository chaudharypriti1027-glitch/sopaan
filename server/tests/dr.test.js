import { describe, expect, it } from '@jest/globals';
import { drConfig } from '../src/config/drConfig.js';
import { getHealthStatus } from '../src/services/healthService.js';
import { env } from '../src/config/env.js';

describe('disaster recovery', () => {
  it('defines RTO/RPO defaults', () => {
    expect(drConfig.rtoMinutes).toBeGreaterThan(0);
    expect(drConfig.rpoMinutes).toBeGreaterThan(0);
    expect(drConfig.verifyCollections.length).toBeGreaterThan(0);
  });

  it('exposes deploy environment in health status', () => {
    const health = getHealthStatus();

    expect(health.deployEnv).toBe(env.deployEnv);
    expect(health.dr).toEqual({
      rtoMinutes: drConfig.rtoMinutes,
      rpoMinutes: drConfig.rpoMinutes,
    });
    expect(['ok', 'degraded']).toContain(health.status);
    expect(health.mongodb).toEqual(expect.any(String));
  });
});
