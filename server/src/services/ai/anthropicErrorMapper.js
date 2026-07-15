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
      'AI is temporarily unavailable because its provider is not configured.',
      503,
      'AI_UNAVAILABLE'
    );
  }

  if (status === 403 || type === 'permission_error') {
    return new AppError('AI is temporarily unavailable.', 503, 'AI_UNAVAILABLE');
  }

  if (status === 429 || type === 'rate_limit_error') {
    return new AppError('AI is busy. Please try again in a moment.', 429, 'AI_RATE_LIMITED');
  }

  if (status === 529 || type === 'overloaded_error') {
    return new AppError(
      'AI service is overloaded. Please try again shortly.',
      503,
      'AI_OVERLOADED'
    );
  }

  const name = err?.name ?? '';
  const isTimeout =
    name === 'TimeoutError' ||
    type === 'ABORT_ERR' ||
    err?.code === 'ABORT_ERR' ||
    /aborted due to timeout|timed?\s*out/i.test(message);

  if (isTimeout) {
    return new AppError('AI took too long to respond. Please try again.', 504, 'AI_TIMEOUT');
  }

  return new AppError('AI generation failed. Please try again.', 502, 'AI_GENERATION_FAILED');
}
