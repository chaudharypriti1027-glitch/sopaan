import type { ComponentType } from 'react';

/** Defer screen module loading until the route is first opened. */
export function lazyScreen<T extends Record<string, ComponentType<unknown>>>(
  loader: () => T,
  exportName: keyof T & string,
): () => ComponentType<unknown> {
  return () => loader()[exportName];
}
