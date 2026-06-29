import * as plannerService from '../services/plannerService.js';

export async function listSessions(req, res) {
  const result = await plannerService.listSessions(req.user._id, req.query.date, req.query);
  res.status(200).json(result);
}

export async function createSession(req, res) {
  const result = await plannerService.createSession(req.user._id, req.body);
  res.status(201).json(result);
}

export async function updateSession(req, res) {
  const result = await plannerService.updateSession(req.user._id, req.params.id, req.body);
  res.status(200).json(result);
}

export async function generatePlan(req, res) {
  const result = await plannerService.generatePlan(req.user._id, req.body.date);
  res.status(201).json(result);
}
