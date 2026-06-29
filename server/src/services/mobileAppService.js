import { mobileAppConfig } from '../config/mobileAppConfig.js';
import { isVersionLessThan } from '../utils/semverCompare.js';

const ALLOWED_PLATFORMS = new Set(['ios', 'android']);

export function evaluateMobileVersionRequirements({ platform, nativeVersion }) {
  const normalizedPlatform = platform?.toLowerCase();
  const storeUrl =
    normalizedPlatform === 'ios'
      ? mobileAppConfig.iosStoreUrl
      : mobileAppConfig.androidStoreUrl;

  const forceUpdate =
    Boolean(nativeVersion) &&
    isVersionLessThan(nativeVersion, mobileAppConfig.minNativeVersion);

  return {
    minNativeVersion: mobileAppConfig.minNativeVersion,
    latestNativeVersion: mobileAppConfig.latestNativeVersion,
    updateChannel: mobileAppConfig.updateChannel,
    forceUpdate,
    forceUpdateTitle: mobileAppConfig.forceUpdateTitle,
    forceUpdateMessage: mobileAppConfig.forceUpdateMessage,
    storeUrl,
    platform: ALLOWED_PLATFORMS.has(normalizedPlatform) ? normalizedPlatform : null,
  };
}

export function assertMobileVersionAllowed({ platform, nativeVersion }) {
  const evaluation = evaluateMobileVersionRequirements({ platform, nativeVersion });

  if (evaluation.forceUpdate && mobileAppConfig.enforceMinVersionOnApi) {
    const error = new Error('App version no longer supported');
    error.statusCode = 426;
    error.code = 'APP_UPDATE_REQUIRED';
    error.details = {
      minNativeVersion: evaluation.minNativeVersion,
      storeUrl: evaluation.storeUrl,
    };
    throw error;
  }

  return evaluation;
}
