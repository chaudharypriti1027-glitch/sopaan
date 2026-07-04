import * as bannerService from '../services/bannerService.js';

export async function getActiveBanner(_req, res) {
  res.status(200).json(await bannerService.getActiveBanner());
}
