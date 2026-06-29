import { getTierStatusForUser } from '../services/quotaService.js';

export async function getTierStatus(req, res) {
  const status = await getTierStatusForUser(req.user);
  res.status(200).json(status);
}
