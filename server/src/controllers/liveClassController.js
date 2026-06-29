import * as liveClassService from '../services/liveClassService.js';

export async function getLiveClasses(req, res) {
  res.status(200).json(await liveClassService.listLiveClasses(req.user?._id, req.query));
}

export async function getLiveClass(req, res) {
  res.status(200).json(await liveClassService.getLiveClassById(req.params.id, req.user?._id));
}

export async function createLiveClass(req, res) {
  res.status(201).json(await liveClassService.createLiveClass(req.user._id, req.body));
}

export async function updateLiveClassStatus(req, res) {
  res.status(200).json(
    await liveClassService.updateLiveClassStatus(req.user._id, req.params.id, req.body.status),
  );
}

export async function createViewerToken(req, res) {
  res.status(200).json(await liveClassService.createViewerToken(req.user._id, req.params.id));
}

export async function setLiveClassReminder(req, res) {
  res.status(201).json(await liveClassService.setLiveClassReminder(req.user._id, req.params.id));
}

export async function removeLiveClassReminder(req, res) {
  res.status(200).json(await liveClassService.removeLiveClassReminder(req.user._id, req.params.id));
}
