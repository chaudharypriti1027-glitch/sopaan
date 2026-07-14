/**
 * API + Socket.io origin. In Vite dev, use the dev-server proxy (same origin).
 * When built and served from the API at /admin/, use window.location.origin.
 * Override with VITE_API_BASE when the API is on another host.
 */
export function resolveApiOrigin(): string {
  const configured = import.meta.env.VITE_API_BASE?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (import.meta.env.DEV) {
    return '';
  }

  return window.location.origin;
}

export function getSocketOrigin(): string {
  return resolveApiOrigin();
}

export function isDevStreamingUrl(url: string | undefined): boolean {
  return Boolean(url?.startsWith('dev://'));
}

export function getApiOrigin(): string {
  return resolveApiOrigin();
}
