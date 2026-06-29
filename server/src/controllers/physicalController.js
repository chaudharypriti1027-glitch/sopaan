import * as physicalService from '../services/physicalService.js';

export async function listLogs(req, res) {
  const result = await physicalService.listLogs(req.user._id, req.query);
  res.status(200).json(result);
}

export async function createLog(req, res) {
  const result = await physicalService.createLog(req.user._id, req.body);
  res.status(201).json(result);
}

export async function getFitnessPlan(req, res) {
  const result = await physicalService.getFitnessPlan(req.user._id, req.query.goal);
  res.status(200).json(result);
}

export async function getStandards(req, res) {
  const result = physicalService.getStandards(req.query.goal);
  res.status(200).json({ goal: req.query.goal ?? 'default', standards: result });
}
