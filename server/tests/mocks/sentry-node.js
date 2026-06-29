export function init() {}

export function captureException() {}

export function captureMessage() {}

export function withScope(callback) {
  callback({
    setTag() {},
    setUser() {},
    setExtra() {},
  });
}

export function setupExpressErrorHandler() {}

export function httpIntegration() {
  return {};
}

export function expressIntegration() {
  return {};
}
