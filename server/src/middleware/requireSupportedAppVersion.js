import { assertMobileVersionAllowed } from '../services/mobileAppService.js';
import { AppError } from '../utils/AppError.js';

/**
 * Optional API-wide guard when APP_ENFORCE_MIN_VERSION=true.
 * Reads X-App-Platform and X-App-Native-Version headers from mobile clients.
 */
export function requireSupportedAppVersion(req, _res, next) {
  const platform = req.get('x-app-platform');
  const nativeVersion = req.get('x-app-native-version');

  if (!platform || !nativeVersion) {
    return next();
  }

  try {
    assertMobileVersionAllowed({ platform, nativeVersion });
    return next();
  } catch (err) {
    if (err.statusCode === 426) {
      return next(
        new AppError(err.message, 426, err.code, {
          minNativeVersion: err.details?.minNativeVersion,
          storeUrl: err.details?.storeUrl,
        }),
      );
    }
    return next(err);
  }
}
