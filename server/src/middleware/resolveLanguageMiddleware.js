import { resolveLanguageFromRequest } from '../utils/resolveLanguage.js';
import { StudentProfile } from '../models/StudentProfile.js';

const profileCache = new WeakMap();

export async function attachResolvedLanguage(req, _res, next) {
  try {
    let profileLanguage;

    if (req.user?._id) {
      let cached = profileCache.get(req);
      if (!cached) {
        cached = await StudentProfile.findOne({ userId: req.user._id })
          .select('preferences.language')
          .lean();
        profileCache.set(req, cached);
      }
      profileLanguage = cached?.preferences?.language;
    }

    req.language = resolveLanguageFromRequest(req, profileLanguage);
    next();
  } catch (err) {
    next(err);
  }
}
