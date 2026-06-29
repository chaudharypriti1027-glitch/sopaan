import { env } from './env.js';

/**
 * Mobile app version policy — override via environment on each deploy target.
 * Bump APP_MIN_NATIVE_VERSION when shipping a native build that breaks OTA compatibility.
 */
export const mobileAppConfig = Object.freeze({
  minNativeVersion: process.env.APP_MIN_NATIVE_VERSION?.trim() || '0.1.0',
  latestNativeVersion: process.env.APP_LATEST_NATIVE_VERSION?.trim() || '0.1.0',
  forceUpdateTitle: process.env.APP_FORCE_UPDATE_TITLE?.trim() || 'Update required',
  forceUpdateMessage:
    process.env.APP_FORCE_UPDATE_MESSAGE?.trim() ||
    'A new version of Sopaan is required to continue. Please update from the app store.',
  androidStoreUrl:
    process.env.APP_ANDROID_STORE_URL?.trim() ||
    'https://play.google.com/store/apps/details?id=com.sopaan.app',
  iosStoreUrl:
    process.env.APP_IOS_STORE_URL?.trim() || 'https://apps.apple.com/app/sopaan/id0000000000',
  /** EAS Update channel hint for clients (staging vs production). */
  updateChannel:
    process.env.APP_UPDATE_CHANNEL?.trim() ||
    (env.isStaging ? 'staging' : env.isProduction ? 'production' : 'development'),
  /** When true, clients below minNativeVersion cannot use the API (optional hard block). */
  enforceMinVersionOnApi: process.env.APP_ENFORCE_MIN_VERSION === 'true',
});
