import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { ExperimentAssignment } from '../src/models/ExperimentAssignment.js';
import { ExperimentEvent } from '../src/models/ExperimentEvent.js';
import {
  getOrAssignExperiments,
  logExperimentEvent,
  trackFirstTest,
  trackSignupComplete,
} from '../src/services/experimentService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('experiment service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('assigns deterministic variants for the same installId', async () => {
    const first = await getOrAssignExperiments({ installId: 'install_alpha' });
    const second = await getOrAssignExperiments({ installId: 'install_alpha' });

    expect(first.assignments).toEqual(second.assignments);
    expect(first.assignments.onboarding_variant).toBeTruthy();
    expect(first.payloads.onboarding_variant.title).toBeTruthy();
  });

  it('logs assignment event on first fetch', async () => {
    await getOrAssignExperiments({ installId: 'install_beta' });

    const events = await ExperimentEvent.find({ event: 'assignment' }).lean();
    expect(events).toHaveLength(1);
    expect(events[0].experiments.onboarding_variant).toBeTruthy();
  });

  it('links install to user on signup and logs signup_complete', async () => {
    const user = await createTestUser({
      name: 'Experimenter',
      email: 'exp@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    await getOrAssignExperiments({ installId: 'install_gamma' });
    await trackSignupComplete({ installId: 'install_gamma', userId: user._id });

    const assignment = await ExperimentAssignment.findOne({ installId: 'install_gamma' }).lean();
    expect(String(assignment.userId)).toBe(String(user._id));

    const signupEvents = await ExperimentEvent.find({ event: 'signup_complete' }).lean();
    expect(signupEvents).toHaveLength(1);
  });

  it('tracks first_test conversion with experiment snapshot', async () => {
    const user = await createTestUser({
      name: 'Tester',
      email: 'tester@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    await getOrAssignExperiments({ installId: 'install_delta', userId: user._id });
    await trackFirstTest(user._id);

    const events = await ExperimentEvent.find({ event: 'first_test' }).lean();
    expect(events).toHaveLength(1);
    expect(events[0].experiments.paywall_copy).toBeTruthy();
  });

  it('returns safe control defaults when installId is missing', async () => {
    const result = await getOrAssignExperiments({ installId: null });

    expect(result.isDefault).toBe(true);
    expect(result.assignments).toEqual({
      onboarding_variant: 'control',
      paywall_copy: 'control',
      home_layout: 'control',
    });
  });

  it('accepts custom conversion events from clients', async () => {
    await logExperimentEvent({
      event: 'paywall_view',
      installId: 'install_eps',
      experiments: { onboarding_variant: 'control', paywall_copy: 'urgency', home_layout: 'control' },
      metadata: { screen: 'Premium' },
    });

    const events = await ExperimentEvent.find({ event: 'paywall_view' }).lean();
    expect(events).toHaveLength(1);
    expect(events[0].metadata.screen).toBe('Premium');
  });
});
