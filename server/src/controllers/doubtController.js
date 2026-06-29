import * as doubtService from '../services/doubtService.js';

export async function listDoubts(req, res) {
  const result = await doubtService.listDoubts(req.query);
  res.status(200).json(result);
}

export async function createDoubt(req, res) {
  const result = await doubtService.createDoubt(req.user._id, req.body);
  res.status(201).json(result);
}

export async function addAnswer(req, res) {
  const result = await doubtService.addAnswer(req.user._id, req.params.id, req.body.body);
  res.status(200).json(result);
}

export async function voteDoubt(req, res) {
  const result = await doubtService.voteDoubt(req.user._id, req.params.id, req.body);
  res.status(200).json(result);
}
