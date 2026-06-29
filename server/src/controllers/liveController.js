import * as liveClassService from '../services/liveClassService.js';

export async function getLiveToken(req, res) {
  res.status(200).json(await liveClassService.createLiveToken(req.user._id, req.params.classId));
}
