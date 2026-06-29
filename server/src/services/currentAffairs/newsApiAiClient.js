import { AppError } from '../../utils/AppError.js';
import { newsApiConfig } from '../../config/newsApiConfig.js';
import { isKnownIndianState, resolveStateLocationUri } from '../../config/indianStateLocations.js';
import { filterExamRelevantArticles } from './newsRelevanceFilter.js';

const CATEGORY_KEYWORDS = {
  Economy: ['economy', 'RBI', 'GDP', 'budget', 'inflation', 'finance', 'fiscal'],
  International: ['foreign policy', 'diplomacy', 'bilateral', 'summit', 'UN', 'G20'],
  Defence: ['defence', 'military', 'army', 'navy', 'air force', 'border security'],
  Schemes: ['government scheme', 'yojana', 'welfare', 'subsidy', 'mission', 'programme'],
};

const NATIONAL_KEYWORDS = [
  'government',
  'ministry',
  'parliament',
  'cabinet',
  'policy',
  'scheme',
  'budget',
  'election',
  'governor',
  'assembly',
];

const STATE_KEYWORDS = [
  'government',
  'minister',
  'assembly',
  'scheme',
  'policy',
  'budget',
  'governor',
];

const IGNORE_KEYWORDS = ['cricket', 'bollywood', 'celebrity', 'football', 'ipl'];

/** Event Registry counts keyword + ignoreKeyword toward one subscription limit (15 on free tier). */
const NEWSAPI_KEYWORD_BUDGET = 15;
const MAX_IGNORE_KEYWORDS = 5;

function appendKeywordFilters(params, keywords) {
  const searchLimit = Math.max(1, NEWSAPI_KEYWORD_BUDGET - MAX_IGNORE_KEYWORDS);
  const trimmedSearch = keywords.slice(0, searchLimit);
  const ignoreBudget = NEWSAPI_KEYWORD_BUDGET - trimmedSearch.length;

  for (const keyword of trimmedSearch) {
    params.append('keyword', keyword);
  }

  for (const ignore of IGNORE_KEYWORDS.slice(0, ignoreBudget)) {
    params.append('ignoreKeyword', ignore);
  }
}

/** @internal test helper */
export function countNewsApiKeywordSlots(keywords = NATIONAL_KEYWORDS) {
  const params = new URLSearchParams();
  appendKeywordFilters(params, keywords);
  return [...params.entries()].filter(([key]) => key === 'keyword' || key === 'ignoreKeyword').length;
}

function monthToDateRange(month) {
  if (!month || month === 'all') {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    return {
      dateStart: formatYmd(start),
      dateEnd: formatYmd(end),
    };
  }

  const [year, monthNum] = month.split('-').map(Number);
  const start = new Date(year, monthNum - 1, 1);
  const end = new Date(year, monthNum, 0);
  return {
    dateStart: formatYmd(start),
    dateEnd: formatYmd(end),
  };
}

function formatYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mapCategoryLabel(categories = []) {
  const labels = categories.map((item) => item.label?.toLowerCase() ?? '');
  const joined = labels.join(' ');

  if (/defen|military|war|army|navy/.test(joined)) return 'Defence';
  if (/econom|finance|business|trade|market/.test(joined)) return 'Economy';
  if (/international|world|foreign|diplom/.test(joined)) return 'International';
  if (/government|society|law|politic|welfare|health/.test(joined)) return 'Schemes';
  return 'General';
}

function truncateSummary(body, maxLen = 220) {
  if (!body) return '';
  const clean = body.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trim()}…`;
}

function mapArticle(article, state) {
  const publishedAt = article.dateTimePub ?? article.dateTime ?? `${article.date}T${article.time ?? '00:00:00'}Z`;
  const sourceTitle = typeof article.source === 'object' ? article.source?.title : article.source;

  return {
    id: `newsapi:${article.uri}|${encodeURIComponent(state && state !== 'national' ? state : 'National')}`,
    title: article.title ?? 'Untitled',
    summary: truncateSummary(article.body),
    body: article.body ?? '',
    category: mapCategoryLabel(article.categories),
    source: sourceTitle ?? 'News',
    sourceUrl: article.url,
    imageUrl: article.image || undefined,
    publishedAt: new Date(publishedAt).toISOString(),
    externalUri: article.uri,
    state: state && state !== 'national' ? state : 'National',
  };
}

function resolveKeywords({ category, state }) {
  const isNational = !state || state === 'National' || state === 'national';

  if (category && CATEGORY_KEYWORDS[category]) {
    return CATEGORY_KEYWORDS[category];
  }

  return isNational ? NATIONAL_KEYWORDS : STATE_KEYWORDS;
}

function buildSearchParams({ limit, offset, month, category, date, state }) {
  const { dateStart, dateEnd } = date
    ? { dateStart: date, dateEnd: date }
    : monthToDateRange(month);

  const normalizedState = state && state !== 'national' ? state : 'National';
  const isNational = normalizedState === 'National';
  const locationUri = resolveStateLocationUri(normalizedState);
  const keywords = resolveKeywords({ category, state: normalizedState });
  const page = Math.floor(offset / limit) + 1;

  const params = new URLSearchParams({
    resultType: 'articles',
    action: 'getArticles',
    lang: newsApiConfig.defaultLang,
    keywordOper: 'or',
    articlesSortBy: 'date',
    articlesSortByAsc: 'false',
    articlesCount: String(Math.min(Math.max(limit * 3, 30), 100)),
    articlesPage: String(page),
    dateStart,
    dateEnd,
    includeArticleCategories: 'true',
    startSourceRankPercentile: '0',
    endSourceRankPercentile: '40',
    apiKey: newsApiConfig.apiKey,
  });

  if (isNational) {
    params.set('sourceLocationUri', locationUri);
    params.append('categoryUri', 'dmoz/Society/Politics');
    params.append('categoryUri', 'dmoz/Society/Government');
  } else {
    params.set('locationUri', locationUri);
  }

  appendKeywordFilters(params, keywords);

  return { params, normalizedState, requestedLimit: limit };
}

export async function fetchNewsApiArticles(query) {
  if (!newsApiConfig.apiKey) {
    throw new AppError('News API is not configured', 503, 'SERVICE_UNAVAILABLE');
  }

  if (query.state && !isKnownIndianState(query.state)) {
    throw new AppError('Unknown state filter', 400, 'VALIDATION_ERROR');
  }

  const { params, normalizedState, requestedLimit } = buildSearchParams(query);
  const url = `${newsApiConfig.baseUrl}?${params.toString()}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new AppError('Failed to fetch news articles', 502, 'UPSTREAM_ERROR');
  }

  const payload = await response.json();

  if (payload.error) {
    throw new AppError(payload.error ?? 'News API error', 502, 'UPSTREAM_ERROR');
  }

  const block = payload.articles ?? {};
  const rawResults = Array.isArray(block.results) ? block.results : [];
  const relevant = filterExamRelevantArticles(rawResults, { state: normalizedState });
  const pageItems = relevant.slice(0, requestedLimit).map((article) => mapArticle(article, normalizedState));

  return {
    items: pageItems,
    total: relevant.length,
  };
}

export async function fetchNewsApiArticleByUri(uri, state = 'National') {
  if (!newsApiConfig.apiKey) {
    throw new AppError('News API is not configured', 503, 'SERVICE_UNAVAILABLE');
  }

  const params = new URLSearchParams({
    resultType: 'articles',
    action: 'getArticles',
    articleUri: uri,
    includeArticleCategories: 'true',
    apiKey: newsApiConfig.apiKey,
  });

  const response = await fetch(`${newsApiConfig.baseUrl}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new AppError('Failed to fetch article', 502, 'UPSTREAM_ERROR');
  }

  const payload = await response.json();
  const article = payload.articles?.results?.[0];

  if (!article) {
    throw new AppError('Current affair not found', 404, 'NOT_FOUND');
  }

  return mapArticle(article, state);
}

export function parseNewsApiId(id) {
  if (!id?.startsWith('newsapi:')) return null;

  const rest = id.slice('newsapi:'.length);
  const pipeIndex = rest.indexOf('|');

  if (pipeIndex === -1) {
    return { uri: rest, state: 'National' };
  }

  return {
    uri: rest.slice(0, pipeIndex),
    state: decodeURIComponent(rest.slice(pipeIndex + 1)) || 'National',
  };
}
