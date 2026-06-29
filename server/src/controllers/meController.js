import * as meService from '../services/meService.js';

export async function getMe(req, res) {
  const profile = await meService.getMe(req.user._id);
  res.status(200).json(profile);
}

export async function getMeSummary(req, res) {
  const summary = await meService.getMeSummary(req.user._id);
  res.status(200).json(summary);
}

export async function updateMe(req, res) {
  const profile = await meService.updateMe(req.user._id, req.body);
  res.status(200).json(profile);
}

export async function uploadAvatar(req, res) {
  const profile = await meService.uploadMeAvatar(req.user._id, req.file);
  res.status(200).json(profile);
}
