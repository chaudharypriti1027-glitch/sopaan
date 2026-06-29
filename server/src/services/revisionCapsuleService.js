import { RevisionCapsule } from '../models/RevisionCapsule.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { caseInsensitiveRegex } from '../utils/regex.js';
import { buildContentLanguageQuery } from '../utils/resolveLanguage.js';

export async function listRevisionCapsules(query) {
  const { limit, offset } = parsePagination(query);
  const filters = {
    ...buildContentLanguageQuery(query.language),
    ...(query.subject ? { subject: caseInsensitiveRegex(query.subject) } : {}),
  };

  const [items, total] = await Promise.all([
    RevisionCapsule.find(filters).sort({ subject: 1, title: 1 }).skip(offset).limit(limit).lean(),
    RevisionCapsule.countDocuments(filters),
  ]);

  return buildPaginatedResult({ items, total, limit, offset });
}

export async function getRevisionCapsuleById(id) {
  const item = await RevisionCapsule.findById(id).lean();

  if (!item) {
    throw new AppError('Revision capsule not found', 404, 'NOT_FOUND');
  }

  return item;
}
