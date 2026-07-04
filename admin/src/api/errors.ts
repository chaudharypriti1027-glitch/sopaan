import { ApiError } from './types';

export function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message || 'Request failed';
  }

  if (err instanceof Error) {
    return err.message;
  }

  return 'Something went wrong';
}
