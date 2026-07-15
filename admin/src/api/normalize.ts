import type { PaginatedResponse } from './contentTypes';

type WithMongoId = {
  _id?: string | { toString(): string };
  id?: string;
};

export function normalizeDoc<T extends WithMongoId>(doc: T): T & { id: string } {
  const id =
    doc.id ??
    (typeof doc._id === 'object' && doc._id !== null && 'toString' in doc._id
      ? doc._id.toString()
      : doc._id != null
        ? String(doc._id)
        : '');
  return { ...doc, id };
}

export function normalizeList<T extends WithMongoId>(
  response: PaginatedResponse<T> | null | undefined,
): PaginatedResponse<T & { id: string }> {
  const items = Array.isArray(response?.items) ? response.items : [];
  return {
    items: items.map(normalizeDoc),
    pagination: {
      total: response?.pagination?.total ?? items.length,
      limit: response?.pagination?.limit ?? items.length,
      offset: response?.pagination?.offset ?? 0,
      hasMore: Boolean(response?.pagination?.hasMore),
    },
  };
}
