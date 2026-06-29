import * as wellnessService from '../services/wellnessService.js';

export async function listSessions(_req, res) {
  res.status(200).json(wellnessService.listWellnessSessions());
}
