import { beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { redactSensitiveData } from '../src/observability/redact.js';
import {
  checkObservabilitySpikes,
  recordAiCostForAlerting,
  recordErrorForAlerting,
  resetAlertsForTests,
} from '../src/observability/alerts.js';
import { observabilityConfig } from '../src/config/observabilityConfig.js';
import { incrementCounter, renderPrometheusMetrics } from '../src/observability/metrics.js';

describe('observability', () => {
  beforeEach(() => {
    resetAlertsForTests();
  });

  it('redacts secrets and masks PII fields', () => {
    const redacted = redactSensitiveData({
      email: 'student@example.com',
      password: 'secret123',
      profile: {
        phone: '+91 9876543210',
        name: 'Asha Kumar',
      },
      token: 'abc',
    });

    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.token).toBe('[REDACTED]');
    expect(redacted.email).toBe('s***@example.com');
    expect(redacted.profile.phone).toBe('***3210');
    expect(redacted.profile.name).toBe('A***');
  });

  it('exposes prometheus metrics with release tag', () => {
    incrementCounter('http_requests_total', {
      method: 'GET',
      route: '/health',
      status: '200',
      status_class: '2xx',
    });

    const body = renderPrometheusMetrics();

    expect(body).toContain('sopaan_release');
    expect(body).toContain(`release="${observabilityConfig.release}"`);
    expect(body).toContain('http_requests_total');
  });

  it('returns x-request-id on API responses', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('fires error spike alerts when threshold is exceeded', async () => {
    for (let i = 0; i < observabilityConfig.errorSpikeThreshold; i += 1) {
      recordErrorForAlerting();
    }

    const snapshot = await checkObservabilitySpikes();

    expect(snapshot.recentErrorCount).toBeGreaterThanOrEqual(
      observabilityConfig.errorSpikeThreshold,
    );
  });

  it('fires AI cost spike alerts when spend exceeds threshold', async () => {
    recordAiCostForAlerting(observabilityConfig.aiCostSpikeUsd + 1);

    const snapshot = await checkObservabilitySpikes();

    expect(snapshot.recentAiCostUsd).toBeGreaterThanOrEqual(observabilityConfig.aiCostSpikeUsd);
  });
});
