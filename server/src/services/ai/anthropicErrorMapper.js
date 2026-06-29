import { AppError } from '../../utils/AppError.js';

function readAnthropicError(err) {
  const status = err?.status ?? err?.response?.status;
  const nested = err?.error?.error ?? err?.error ?? {};
  const type = nested.type ?? err?.code;
  const message = nested.message ?? err?.message ?? 'Unknown AI error';

  return { status, type, message };
}

export function mapAnthropicError(err) {
  if (err instanceof AppError) {
    return err;
  }

  const { status, type, message } = readAnthropicError(err);

  if (status === 401 || type === 'authentication_error') {
    return new AppError(
      'AI is not configured on the server. Add a valid ANTHROPIC_API_KEY or set DEV_STUB_AI=true for local development.',
      503,
      'AI_NOT_CONFIGURED',
    );
  }

  if (status === 403 || type === 'permission_error') {
    return new AppError('AI access denied for this API key.', 503, 'AI_NOT_CONFIGURED');
  }

  if (status === 429 || type === 'rate_limit_error') {
    return new AppError('AI is busy. Please try again in a moment.', 429, 'AI_RATE_LIMITED');
  }

  if (status === 529 || type === 'overloaded_error') {
    return new AppError('AI service is overloaded. Please try again shortly.', 503, 'AI_OVERLOADED');
  }

  if (message) {
    return new AppError(`AI request failed: ${message}`, 502, 'AI_GENERATION_FAILED');
  }

  return new AppError('AI request failed', 502, 'AI_GENERATION_FAILED');
}
