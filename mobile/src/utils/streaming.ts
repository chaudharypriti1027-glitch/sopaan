export function isDevStreamingUrl(url?: string | null): boolean {
  return Boolean(url?.startsWith('dev://'));
}
