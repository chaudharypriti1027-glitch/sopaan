import * as attemptService from '../services/attemptService.js';

export async function listAttempts(req, res) {
  const result = await attemptService.listAttempts(req.user._id, req.query);
  res.status(200).json(result);
}

export async function getAttempt(req, res) {
  const result = await attemptService.getAttemptAnalysis(req.user._id, req.params.id);
  res.status(200).json(result);
}
