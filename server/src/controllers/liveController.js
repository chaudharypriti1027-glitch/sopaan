import * as liveClassService from '../services/liveClassService.js';
import * as liveEgressWebhookService from '../services/liveEgressWebhookService.js';

export async function getLiveToken(req, res) {
  res.status(200).json(await liveClassService.createLiveToken(req.user._id, req.params.classId));
}

export async function handleEgressWebhook(req, res) {
  const authHeader = req.get('Authorization') ?? req.get('authorize');
  const result = await liveEgressWebhookService.handleLiveEgressWebhook(req.body, authHeader);
  res.status(200).json(result);
}
