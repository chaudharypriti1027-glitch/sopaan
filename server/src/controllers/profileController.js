import * as profileService from '../services/profileService.js';

export async function getProfile(req, res) {
  const result = await profileService.getProfile(req.user._id);
  res.status(200).json(result);
}

export async function updateProfile(req, res) {
  const result = await profileService.updateProfile(req.user._id, req.body);
  res.status(200).json(result);
}

export async function updateGoal(req, res) {
  const result = await profileService.updateGoal(req.user._id, req.body);
  res.status(200).json(result);
}

export async function getReadiness(req, res) {
  const result = await profileService.getProfileReadiness(req.user._id);
  res.status(200).json(result);
}

export async function getGoal(req, res) {
  const result = await profileService.getGoalRoadmap(req.user._id);
  res.status(200).json(result);
}
