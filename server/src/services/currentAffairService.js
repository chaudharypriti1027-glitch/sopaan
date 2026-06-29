import { CurrentAffair } from '../models/CurrentAffair.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, endOfDay, parsePagination, startOfDay } from '../utils/pagination.js';
import { publishedContentFilter } from '../models/publishableFields.js';
import { CACHE_TTLS } from '../config/cacheConfig.js';
import { cacheGetOrSet, stableCacheKey } from '../lib/cache.js';
import { isNewsApiEnabled } from '../config/newsApiConfig.js';
import {
  fetchNewsApiArticleByUri,
  fetchNewsApiArticles,
  parseNewsApiId,
} from './currentAffairs/newsApiAiClient.js';

function parseMonthRange(month) {
  if (!month || month === 'all') {
    return null;
  }

  const [year, monthNum] = month.split('-').map(Number);
  if (!year || !monthNum) {
    return null;
  }

  return {
    $gte: startOfDay(new Date(year, monthNum - 1, 1)),
    $lte: endOfDay(new Date(year, monthNum, 0)),
  };
}

function buildFilters({ date, category, month }) {
  const clauses = [publishedContentFilter];

  if (category) {
    clauses.push({ category });
  }

  if (date) {
    clauses.push({
      publishedAt: {
        $gte: startOfDay(date),
        $lte: endOfDay(date),
      },
    });
  } else {
    const monthRange = parseMonthRange(month);
    if (monthRange) {
      clauses.push({ publishedAt: monthRange });
    }
  }

  return clauses.length === 1 ? clauses[0] : { $and: clauses };
}

async function listFromDatabase(query) {
  const { limit, offset } = parsePagination(query);
  const filters = buildFilters(query);

  const [items, total] = await Promise.all([
    CurrentAffair.find(filters)
      .select('-quizQuestions')
      .sort({ publishedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    CurrentAffair.countDocuments(filters),
  ]);

  return buildPaginatedResult({ items, total, limit, offset });
}

async function listFromNewsApi(query) {
  const { limit, offset } = parsePagination(query);
  const { items, total } = await fetchNewsApiArticles({
    limit,
    offset,
    month: query.month,
    category: query.category,
    date: query.date,
    state: query.state,
  });

  return buildPaginatedResult({ items, total, limit, offset });
}

async function listFromNewsApiWithFallback(query) {
  try {
    return await listFromNewsApi(query);
  } catch (err) {
    if (err instanceof AppError && (err.statusCode === 502 || err.statusCode === 503)) {
      console.warn(`[ca] NewsAPI unavailable, using database fallback: ${err.message}`);
      return listFromDatabase(query);
    }
    throw err;
  }
}

export async function listCurrentAffairs(query) {
  if (isNewsApiEnabled()) {
    const cacheKey = stableCacheKey('cache:ca:newsapi', {
      limit: query.limit,
      offset: query.offset,
      month: query.month,
      category: query.category,
      date: query.date,
      state: query.state,
    });

    return cacheGetOrSet(cacheKey, CACHE_TTLS.currentAffairsListSec, () =>
      listFromNewsApiWithFallback(query),
    );
  }

  const { limit, offset } = parsePagination(query);
  const cacheKey = stableCacheKey('cache:ca:list', {
    limit,
    offset,
    date: query.date,
    category: query.category,
    month: query.month,
  });

  return cacheGetOrSet(cacheKey, CACHE_TTLS.currentAffairsListSec, () => listFromDatabase(query));
}

export async function getCurrentAffairById(id) {
  const newsRef = parseNewsApiId(id);
  if (newsRef) {
    return fetchNewsApiArticleByUri(newsRef.uri, newsRef.state);
  }

  const item = await CurrentAffair.findOne({ $and: [{ _id: id }, publishedContentFilter] })
    .populate('quizQuestions')
    .lean();

  if (!item) {
    throw new AppError('Current affair not found', 404, 'NOT_FOUND');
  }

  return {
    ...item,
    id: item._id.toString(),
  };
}
