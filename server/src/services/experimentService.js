import crypto from 'crypto';
import {
  EXPERIMENT_KEYS,
  EXPERIMENTS,
  buildPayloadsForAssignments,
  getDefaultAssignments,
} from '../config/experimentsConfig.js';
import { ExperimentAssignment } from '../models/ExperimentAssignment.js';
import { ExperimentEvent } from '../models/ExperimentEvent.js';

function pickVariant(experimentKey, bucketKey) {
  const experiment = EXPERIMENTS[experimentKey];
  if (!experiment?.variants?.length) {
    return 'control';
  }

  const hash = crypto.createHash('sha256').update(`${experimentKey}:${bucketKey}`).digest();
  const roll = hash.readUInt32BE(0) % 100;

  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (roll < cumulative) {
      return variant.id;
    }
  }

  return experiment.variants[experiment.variants.length - 1].id;
}

function assignAllExperiments(bucketKey) {
  const assignments = {};

  for (const key of EXPERIMENT_KEYS) {
    assignments[key] = pickVariant(key, bucketKey);
  }

  return assignments;
}

function normalizeAssignments(raw = {}) {
  const assignments = getDefaultAssignments();

  for (const key of EXPERIMENT_KEYS) {
    const variant = raw[key];
    const experiment = EXPERIMENTS[key];
    const valid = experiment?.variants?.some((item) => item.id === variant);
    if (valid) {
      assignments[key] = variant;
    }
  }

  return assignments;
}

export async function logExperimentEvent({
  event,
  installId = null,
  userId = null,
  experiments = {},
  metadata = {},
}) {
  if (!event) {
    return { logged: false, reason: 'missing_event' };
  }

  await ExperimentEvent.create({
    installId,
    userId,
    event,
    experiments: normalizeAssignments(experiments),
    metadata,
  });

  return { logged: true };
}

export async function linkExperimentsToUser(installId, userId) {
  if (!installId || !userId) {
    return null;
  }

  const doc = await ExperimentAssignment.findOneAndUpdate(
    { installId },
    { $set: { userId } },
    { new: true },
  );

  return doc?.assignments ?? null;
}

export async function getOrAssignExperiments({ installId, userId = null }) {
  if (!installId) {
    const assignments = getDefaultAssignments();
    return {
      installId: null,
      assignments,
      payloads: buildPayloadsForAssignments(assignments),
      isDefault: true,
    };
  }

  let doc = await ExperimentAssignment.findOne({ installId });

  if (!doc) {
    const assignments = assignAllExperiments(installId);
    doc = await ExperimentAssignment.create({
      installId,
      userId,
      assignments,
    });

    await logExperimentEvent({
      event: 'assignment',
      installId,
      userId,
      experiments: assignments,
      metadata: { source: 'server_assign' },
    }).catch((err) => {
      console.warn('[experiments] assignment log failed:', err.message);
    });
  } else if (userId && !doc.userId) {
    doc.userId = userId;
    await doc.save();
  }

  const assignments = normalizeAssignments(doc.assignments);

  if (JSON.stringify(assignments) !== JSON.stringify(doc.assignments)) {
    doc.assignments = assignments;
    await doc.save();
  }

  return {
    installId,
    assignments,
    payloads: buildPayloadsForAssignments(assignments),
    isDefault: false,
  };
}

export async function trackSignupComplete({ installId, userId }) {
  const { assignments } = await getOrAssignExperiments({ installId, userId });

  await linkExperimentsToUser(installId, userId);

  return logExperimentEvent({
    event: 'signup_complete',
    installId,
    userId,
    experiments: assignments,
  });
}

export async function trackOnboardingComplete({ installId, userId }) {
  const doc = userId
    ? await ExperimentAssignment.findOne({ $or: [{ userId }, { installId }] })
    : await ExperimentAssignment.findOne({ installId });

  const assignments = normalizeAssignments(doc?.assignments);

  return logExperimentEvent({
    event: 'onboarding_complete',
    installId: doc?.installId ?? installId ?? null,
    userId,
    experiments: assignments,
  });
}

export async function trackFirstTest({ userId }) {
  const doc = await ExperimentAssignment.findOne({ userId });
  const assignments = normalizeAssignments(doc?.assignments);

  return logExperimentEvent({
    event: 'first_test',
    installId: doc?.installId ?? null,
    userId,
    experiments: assignments,
  });
}

export async function trackTrialStart({ userId }) {
  const doc = await ExperimentAssignment.findOne({ userId });
  const assignments = normalizeAssignments(doc?.assignments);

  return logExperimentEvent({
    event: 'trial_start',
    installId: doc?.installId ?? null,
    userId,
    experiments: assignments,
  });
}

export async function getExperimentSummary() {
  const pipeline = [
    {
      $group: {
        _id: { event: '$event', variant: '$experiments.onboarding_variant' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.event': 1, count: -1 } },
  ];

  const rows = await ExperimentEvent.aggregate(pipeline);

  return rows.map((row) => ({
    event: row._id.event,
    variant: row._id.variant ?? 'unknown',
    count: row.count,
  }));
}
