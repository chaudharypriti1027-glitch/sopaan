import { isPremiumActive } from '../services/premiumService.js';
import { buildPremiumRequiredError } from '../services/quotaService.js';

/** @deprecated use requirePro from requirePro.js */
export async function requirePremium(req, _res, next) {
  try {
    const active = await isPremiumActive(req.user);

    if (!active) {
      throw buildPremiumRequiredError('ai_evaluate');
    }

    next();
  } catch (err) {
    next(err);
  }
}
