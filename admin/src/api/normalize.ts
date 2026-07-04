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
  response: PaginatedResponse<T>,
): PaginatedResponse<T & { id: string }> {
  return {
    ...response,
    items: response.items.map(normalizeDoc),
  };
}
