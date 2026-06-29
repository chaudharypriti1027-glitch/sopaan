import { assertFeatureAccess, buildProRequiredError, resolveTierAccess } from '../services/quotaService.js';
import { AppError } from '../utils/AppError.js';
import { TIER_FEATURES } from '../config/freeTierConfig.js';

export function requirePro(featureKey) {
  return async (req, _res, next) => {
    try {
      if (!TIER_FEATURES[featureKey]) {
        throw new AppError('Unknown feature gate', 500, 'INVALID_FEATURE');
      }

      const { isPro } = await resolveTierAccess(req.user);
      if (!isPro) {
        throw buildProRequiredError(featureKey);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export function checkQuota(featureKey) {
  return async (req, _res, next) => {
    try {
      await assertFeatureAccess(req.user, featureKey);
      next();
    } catch (err) {
      next(err);
    }
  };
}
