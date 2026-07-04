import * as notificationService from '../services/notificationService.js';

export async function listNotifications(req, res) {
  const result = await notificationService.listNotifications(req.user._id, req.query);
  res.status(200).json(result);
}

export async function markRead(req, res) {
  const result = await notificationService.markNotificationRead(req.user._id, req.params.id);
  res.status(200).json(result);
}

export async function trackOpen(req, res) {
  const result = await notificationService.trackNotificationOpen(req.user._id, req.body);
  res.status(200).json(result);
}

export async function registerPushToken(req, res) {
  const result = await notificationService.registerPushToken(req.user._id, req.body);
  res.status(200).json(result);
}

export async function updatePushSettings(req, res) {
  const result = await notificationService.updatePushSettings(req.user._id, req.body.enabled);
  res.status(200).json(result);
}

export async function getNotificationPreferences(req, res) {
  const result = await notificationService.getNotificationPreferences(req.user._id);
  res.status(200).json(result);
}

export async function updateNotificationPreferences(req, res) {
  const result = await notificationService.updateNotificationPreferences(req.user._id, req.body);
  res.status(200).json(result);
}

/** @deprecated */
export async function getAlertPreferences(req, res) {
  const result = await notificationService.getAlertPreferences(req.user._id);
  res.status(200).json(result);
}

/** @deprecated */
export async function updateAlertPreferences(req, res) {
  const result = await notificationService.updateAlertPreferences(req.user._id, req.body);
  res.status(200).json(result);
}
