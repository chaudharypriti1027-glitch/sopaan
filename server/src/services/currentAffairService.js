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
import { summarizeForAspirants } from './ai/summarizeForAspirants.js';

const MERGE_LOOKBACK_LIMIT = 200;

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

function affairStudyFields(doc) {
  return {
    shortAnswer: doc.shortAnswer ?? null,
    examTip: doc.examTip ?? null,
    keyPoints: Array.isArray(doc.keyPoints) ? doc.keyPoints.filter(Boolean) : [],
    heroMediaKey: doc.heroMediaKey ?? null,
  };
}

function toPublicListItem(doc) {
  const quizQuestionCount = Array.isArray(doc.quizQuestions) ? doc.quizQuestions.length : 0;

  return {
    id: doc._id.toString(),
    title: doc.title,
    summary: doc.summary,
    body: doc.body ?? doc.summary,
    category: doc.category,
    source: doc.source,
    sourceUrl: doc.sourceUrl,
    publishedAt: doc.publishedAt,
    imageColor: doc.imageColor,
    imageUrl: doc.imageUrl,
    quizQuestionCount,
    ...affairStudyFields(doc),
  };
}

function toPublicDetailItem(doc) {
  const quizQuestions = Array.isArray(doc.quizQuestions)
    ? doc.quizQuestions.map((entry) =>
        typeof entry === 'string' ? entry : entry._id?.toString() ?? String(entry),
      )
    : [];

  return {
    ...toPublicListItem(doc),
    quizQuestions,
    quizQuestionCount: quizQuestions.length,
  };
}

async function listPublishedFromDatabase(query, { limit, offset, includeQuizMeta = true }) {
  const filters = buildFilters(query);
  const projection = includeQuizMeta ? undefined : '-quizQuestions';

  const [docs, total] = await Promise.all([
    CurrentAffair.find(filters)
      .select(projection)
      .sort({ publishedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    CurrentAffair.countDocuments(filters),
  ]);

  return buildPaginatedResult({
    items: docs.map(toPublicListItem),
    total,
    limit,
    offset,
  });
}

async function listAllPublishedFromDatabase(query, maxItems = MERGE_LOOKBACK_LIMIT) {
  const filters = buildFilters(query);
  const docs = await CurrentAffair.find(filters)
    .sort({ publishedAt: -1 })
    .limit(maxItems)
    .lean();

  return docs.map(toPublicListItem);
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

async function listMergedAffairs(query) {
  const { limit, offset } = parsePagination(query);
  const [dbItems, newsResult] = await Promise.all([
    listAllPublishedFromDatabase(query),
    isNewsApiEnabled()
      ? listFromNewsApi({ ...query, limit: MERGE_LOOKBACK_LIMIT, offset: 0 }).catch((err) => {
          if (err instanceof AppError && (err.statusCode === 502 || err.statusCode === 503)) {
            console.warn(`[ca] NewsAPI unavailable during merge: ${err.message}`);
            return { items: [], pagination: { total: 0 } };
          }
          throw err;
        })
      : Promise.resolve({ items: [], pagination: { total: 0 } }),
  ]);

  const dbIds = new Set(dbItems.map((item) => item.id));
  const combined = [
    ...dbItems,
    ...newsResult.items.filter((item) => item?.id && !dbIds.has(item.id)),
  ];

  combined.sort(
    (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime(),
  );

  return buildPaginatedResult({
    items: combined.slice(offset, offset + limit),
    total: combined.length,
    limit,
    offset,
  });
}

export async function listCurrentAffairs(query) {
  if (isNewsApiEnabled()) {
    const cacheKey = stableCacheKey('cache:ca:merged', {
      limit: query.limit,
      offset: query.offset,
      month: query.month,
      category: query.category,
      date: query.date,
      state: query.state,
    });

    return cacheGetOrSet(cacheKey, CACHE_TTLS.currentAffairsListSec, () => listMergedAffairs(query));
  }

  const { limit, offset } = parsePagination(query);
  const cacheKey = stableCacheKey('cache:ca:list', {
    limit,
    offset,
    date: query.date,
    category: query.category,
    month: query.month,
  });

  return cacheGetOrSet(cacheKey, CACHE_TTLS.currentAffairsListSec, () =>
    listPublishedFromDatabase(query, { limit, offset }),
  );
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

  return toPublicDetailItem(item);
}

function formatQuizForGame(question) {
  const correctOption = (question.options ?? []).find(
    (option) => option.key?.toUpperCase() === question.correctKey?.toUpperCase(),
  );

  return {
    id: question._id.toString(),
    prompt: question.text,
    options: (question.options ?? []).map((option) => option.text),
    answer: correctOption?.text ?? '',
    explanation: question.explanation ?? '',
  };
}

export async function getAffairStudyPack(id) {
  const item = await CurrentAffair.findOne({ $and: [{ _id: id }, publishedContentFilter] }).lean();

  if (!item) {
    throw new AppError('Current affair not found', 404, 'NOT_FOUND');
  }

  return {
    id: item._id.toString(),
    title: item.title,
    summary: item.summary,
    shortAnswer: item.shortAnswer ?? null,
    examTip: item.examTip ?? null,
    keyPoints: Array.isArray(item.keyPoints) ? item.keyPoints.filter(Boolean) : [],
    quizQuestionCount: Array.isArray(item.quizQuestions) ? item.quizQuestions.length : 0,
  };
}

export async function getAffairQuizGame(id) {
  const item = await CurrentAffair.findOne({ $and: [{ _id: id }, publishedContentFilter] })
    .populate('quizQuestions')
    .lean();

  if (!item) {
    throw new AppError('Current affair not found', 404, 'NOT_FOUND');
  }

  const questions = (item.quizQuestions ?? [])
    .filter((entry) => entry && typeof entry === 'object')
    .map(formatQuizForGame)
    .filter((question) => question.answer && question.options.length >= 2);

  if (!questions.length) {
    throw new AppError('No quiz questions for this affair', 404, 'NOT_FOUND');
  }

  return {
    affairId: item._id.toString(),
    title: item.title,
    questions,
  };
}

export function hasAiStudyPack(affair) {
  return Boolean(
    affair.shortAnswer?.trim() ||
      (affair.examTip?.trim() &&
        Array.isArray(affair.keyPoints) &&
        affair.keyPoints.filter(Boolean).length >= 2),
  );
}

export function buildAiSummaryResponse(affair, aiResult, source) {
  return {
    affairId: affair.id,
    title: affair.title,
    summary: aiResult?.summary ?? affair.summary ?? null,
    shortAnswer: aiResult?.shortAnswer ?? affair.shortAnswer ?? null,
    examTip: aiResult?.examTip ?? affair.examTip ?? null,
    keyPoints: aiResult?.keyPoints ?? affair.keyPoints ?? [],
    category: aiResult?.category ?? affair.category ?? null,
    source,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Returns an exam-focused AI summary for a current-affairs article.
 * Uses stored study fields when present; otherwise generates and caches a summary.
 */
export async function getAffairAiSummary(id, { language = 'en' } = {}) {
  const affair = await getCurrentAffairById(id);

  if (hasAiStudyPack(affair)) {
    return buildAiSummaryResponse(affair, null, 'cached');
  }

  const cacheKey = stableCacheKey('ca-ai-summary', { id, language });

  return cacheGetOrSet(cacheKey, CACHE_TTLS.currentAffairDetailSec, async () => {
    const snippet = (affair.body ?? affair.summary ?? affair.title ?? '').replace(/\s+/g, ' ').trim();
    const aiResult = await summarizeForAspirants({
      title: affair.title,
      snippet: snippet.slice(0, 2000),
      sourceName: affair.source || 'News',
      sourceUrl: affair.sourceUrl,
      publishedAt: affair.publishedAt,
      language,
    });

    if (!parseNewsApiId(id)) {
      await CurrentAffair.findByIdAndUpdate(id, {
        summary: aiResult.summary,
        shortAnswer: aiResult.shortAnswer,
        examTip: aiResult.examTip,
        keyPoints: aiResult.keyPoints,
        ...(aiResult.category ? { category: aiResult.category } : {}),
      });
    }

    return buildAiSummaryResponse(affair, aiResult, 'generated');
  });
}
