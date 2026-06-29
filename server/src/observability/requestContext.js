import { AsyncLocalStorage } from 'async_hooks';
import crypto from 'crypto';

const storage = new AsyncLocalStorage();

export function getRequestContext() {
  return storage.getStore() ?? {};
}

export function getRequestId() {
  return getRequestContext().requestId ?? null;
}

export function runWithRequestContext(context, fn) {
  return storage.run(context, fn);
}

export function createRequestId(existing) {
  if (typeof existing === 'string' && existing.trim().length >= 8) {
    return existing.trim();
  }

  return crypto.randomUUID();
}
