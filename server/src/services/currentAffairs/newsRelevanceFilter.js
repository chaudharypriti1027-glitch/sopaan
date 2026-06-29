const BLOCKLIST = [
  'cricket',
  'ipl',
  'bollywood',
  'movie',
  'film',
  'actor',
  'actress',
  'celebrity',
  'football',
  'wedding',
  'divorce',
  'box office',
  'kardashian',
  'fashion week',
  'reality show',
  'tiktok',
  'instagram influencer',
  'gold price',
  'stock tip',
  'horoscope',
  'zodiac',
  'recipe',
  'viral video',
  'meme',
  'dating',
  'bigg boss',
];

const EXAM_SIGNALS = [
  'government',
  'minister',
  'ministry',
  'parliament',
  'lok sabha',
  'rajya sabha',
  'assembly',
  'cabinet',
  'policy',
  'scheme',
  'yojana',
  'budget',
  'rbi',
  'reserve bank',
  'upsc',
  'governor',
  'chief minister',
  'election',
  'poll',
  'bill',
  'ordinance',
  'act passed',
  'welfare',
  'subsidy',
  'defence',
  'military',
  'bilateral',
  'summit',
  'treaty',
  'gdp',
  'inflation',
  'judiciary',
  'supreme court',
  'high court',
  'commission',
  'tribunal',
  'inaugurat',
  'launch',
  'mission',
  'niti aayog',
  'pib',
];

function normalizeText(value = '') {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function isExamRelevantArticle(article, { state } = {}) {
  const title = normalizeText(article.title);
  const body = normalizeText(article.body ?? article.summary ?? '');
  const combined = `${title} ${body.slice(0, 400)}`;

  if (!title || title.length < 12) {
    return false;
  }

  if (BLOCKLIST.some((term) => combined.includes(term))) {
    return false;
  }

  const hasExamSignal = EXAM_SIGNALS.some((term) => combined.includes(term));
  if (!hasExamSignal) {
    return false;
  }

  if (state && state !== 'National' && state !== 'national') {
    const stateName = normalizeText(state);
    const firstToken = stateName.split(' ')[0];
    const mentionsState = combined.includes(stateName) || title.includes(firstToken);
    if (!mentionsState) {
      return false;
    }
  }

  return true;
}

export function filterExamRelevantArticles(articles, options = {}) {
  return articles.filter((article) => isExamRelevantArticle(article, options));
}
