/**
 * API + Socket.io must reach the API server. In Vite dev, proxying through
 * port 5173 is unreliable — connect to the API origin directly instead.
 */
export function getSocketOrigin(): string {
  const configured = import.meta.env.VITE_API_BASE?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:4000';
  }

  return window.location.origin;
}

export function isDevStreamingUrl(url: string | undefined): boolean {
  return Boolean(url?.startsWith('dev://'));
}

export function getApiOrigin(): string {
  return getSocketOrigin();
}
