let showSessionExpiredDialog: (() => void) | null = null;

export function registerSessionExpiredDialog(handler: (() => void) | null) {
  showSessionExpiredDialog = handler;
}

export function triggerSessionExpiredDialog() {
  showSessionExpiredDialog?.();
}
