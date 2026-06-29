import axios, { isAxiosError } from 'axios';
import type { ApiErrorBody } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorBody['error']['details'];

  constructor(
    message: string,
    status: number,
    code: string,
    details?: ApiErrorBody['error']['details'],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isAxiosError<ApiErrorBody>(error)) {
    const status = error.response?.status ?? 0;

    if (!error.response) {
      const code =
        error.code === 'ECONNABORTED'
          ? 'ECONNABORTED'
          : error.message?.toLowerCase().includes('network')
            ? 'NETWORK_ERROR'
            : (error.code ?? 'NETWORK_ERROR');
      return new ApiError(error.message || 'Network error', 0, code);
    }

    const message = error.response.data?.error?.message ?? error.message ?? 'Request failed';
    const code = error.response.data?.error?.code ?? 'REQUEST_FAILED';
    const details = error.response.data?.error?.details;
    return new ApiError(message, status, code, details);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0, 'UNKNOWN');
  }

  return new ApiError('Unknown error', 0, 'UNKNOWN');
}

export async function rawPost<T>(url: string, body: unknown): Promise<T> {
  const { data } = await axios.post<T>(url, body, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}
