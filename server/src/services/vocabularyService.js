import { VocabularyWord } from '../models/VocabularyWord.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, endOfDay, parsePagination, startOfDay } from '../utils/pagination.js';

export async function getTodaysVocabulary(referenceDate = new Date()) {
  const dayStart = startOfDay(referenceDate);
  const dayEnd = endOfDay(referenceDate);

  let word = await VocabularyWord.findOne({
    date: { $gte: dayStart, $lte: dayEnd },
  }).lean();

  if (!word) {
    word = await VocabularyWord.findOne({ date: { $lte: dayEnd } })
      .sort({ date: -1 })
      .lean();
  }

  if (!word) {
    throw new AppError('No vocabulary word available', 404, 'NOT_FOUND');
  }

  return word;
}

export async function listRecentVocabulary(query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 7, maxLimit: 50 });

  const [items, total] = await Promise.all([
    VocabularyWord.find({}).sort({ date: -1 }).skip(offset).limit(limit).lean(),
    VocabularyWord.countDocuments({}),
  ]);

  return buildPaginatedResult({ items, total, limit, offset });
}
