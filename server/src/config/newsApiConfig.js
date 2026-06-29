export const newsApiConfig = {
  apiKey: process.env.NEWSAPI_AI_KEY ?? '',
  baseUrl: process.env.NEWSAPI_AI_BASE_URL ?? 'https://eventregistry.org/api/v1/article/getArticles',
  indiaLocationUri: 'http://en.wikipedia.org/wiki/India',
  defaultLang: 'eng',
  /** When month is "all", limit lookback to keep responses fast. */
  allMonthsLookback: Number(process.env.NEWSAPI_AI_ALL_MONTHS_LOOKBACK ?? 6),
};

export function isNewsApiEnabled() {
  return Boolean(newsApiConfig.apiKey) && process.env.NODE_ENV !== 'test';
}
