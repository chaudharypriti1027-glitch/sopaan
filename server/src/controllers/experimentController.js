import {
  getOrAssignExperiments,
  logExperimentEvent,
} from '../services/experimentService.js';

export async function getExperiments(req, res) {
  const installId = String(req.query.installId ?? '').trim() || null;

  const result = await getOrAssignExperiments({
    installId,
    userId: req.user?._id ?? null,
  });

  res.json(result);
}

export async function trackEvent(req, res) {
  const { installId, event, metadata } = req.body;

  const { assignments } = await getOrAssignExperiments({
    installId,
    userId: req.user?._id ?? null,
  });

  const result = await logExperimentEvent({
    event,
    installId,
    userId: req.user?._id ?? null,
    experiments: assignments,
    metadata: metadata ?? {},
  });

  res.json(result);
}
