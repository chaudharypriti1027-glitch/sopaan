import i18n from '../i18n';
import { ApiError, parseApiError } from '../api/errors';

const OFFLINE_CODES = new Set(['NETWORK_ERROR', 'ECONNABORTED', 'ERR_NETWORK']);

export function getUserFacingMessage(error: unknown): string {
  const parsed = parseApiError(error);

  if (parsed instanceof ApiError) {
    if (OFFLINE_CODES.has(parsed.code) || (parsed.status === 0 && !parsed.message.includes('refresh'))) {
      return i18n.t('common:offlineHint');
    }

    if (parsed.status === 401 || parsed.code === 'UNAUTHORIZED') {
      return i18n.t('common:sessionExpired');
    }

    if (parsed.status === 429 || parsed.code === 'RATE_LIMITED' || parsed.code === 'AI_RATE_LIMITED') {
      return i18n.t('common:aiRateLimited');
    }

    if (parsed.code === 'AI_NOT_CONFIGURED') {
      return i18n.t('common:aiNotConfigured');
    }

    if (parsed.code === 'AI_OVERLOADED') {
      return i18n.t('common:aiOverloaded');
    }

    if (parsed.code === 'AI_GENERATION_FAILED' || parsed.code === 'AI_RESPONSE_INVALID') {
      return i18n.t('common:aiGenerationFailed');
    }

    if (parsed.code === 'QUOTA_EXCEEDED') {
      return i18n.t('common:quotaExceeded');
    }

    if (parsed.code === 'PRO_REQUIRED' || parsed.code === 'PREMIUM_REQUIRED') {
      return i18n.t('common:proRequired');
    }

    if (parsed.code === 'VALIDATION_ERROR') {
      return i18n.t('common:validationFailed');
    }

    if (parsed.code === 'NOT_FOUND') {
      return i18n.t('common:notFound');
    }

    if (parsed.status === 404) {
      return i18n.t('common:notFound');
    }

    if (parsed.status >= 500) {
      return i18n.t('common:serverError');
    }
  }

  const message = parsed.message?.trim();
  if (message && message !== 'Request failed' && message !== 'Unknown error') {
    return message;
  }

  return i18n.t('common:requestFailed');
}
