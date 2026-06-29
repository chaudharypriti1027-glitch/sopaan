import { captureMobileException } from '../observability/sentry';

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;

declare const ErrorUtils: {
  getGlobalHandler: () => GlobalHandler | undefined;
  setGlobalHandler: (handler: GlobalHandler) => void;
};

let installed = false;

export function installGlobalErrorHandlers() {
  if (installed) {
    return;
  }
  installed = true;

  const previousHandler = ErrorUtils.getGlobalHandler?.();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    captureMobileException(error, {
      tags: {
        source: 'globalHandler',
        isFatal: String(Boolean(isFatal)),
      },
    });
    previousHandler?.(error, isFatal);
  });

  if (typeof globalThis.addEventListener === 'function') {
    globalThis.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      captureMobileException(event.reason, {
        tags: { source: 'unhandledRejection' },
      });
    });
  }
}
