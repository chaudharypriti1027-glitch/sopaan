/**
 * Configurable current-affairs feed sources.
 *
 * We only fetch syndicated RSS/Atom feeds — never scrape full article pages.
 * Each source documents licensing/attribution expectations; disable sources
 * you do not have rights to use via `enabled: false` or CA_DIGEST_SOURCES env.
 */

export const DEFAULT_CA_SOURCES = Object.freeze([
  {
    id: 'pib-english',
    name: 'PIB',
    feedUrl: 'https://pib.gov.in/RssEnglish.aspx',
    feedType: 'rss',
    enabled: true,
    maxItemsPerRun: 5,
    maxAgeHours: 36,
    maxDescriptionChars: 500,
    attribution: 'Source: Press Information Bureau, Government of India',
    terms:
      'PIB releases are Government of India communications. Use RSS metadata only; write original summaries; link to the official release.',
    categoryHint: 'National',
  },
  {
    id: 'prs-bill-track',
    name: 'PRS Legislative Research',
    feedUrl: 'https://www.prsindia.org/rss/bill-track',
    feedType: 'rss',
    enabled: true,
    maxItemsPerRun: 3,
    maxAgeHours: 48,
    maxDescriptionChars: 400,
    attribution: 'Source: PRS Legislative Research',
    terms:
      'PRS RSS is provided for research and education. Summarize in original words; do not republish full PRS text.',
    categoryHint: 'Polity',
  },
]);

export function parseCaSourcesFromEnv(rawJson) {
  if (!rawJson?.trim()) {
    return null;
  }

  const parsed = JSON.parse(rawJson);

  if (!Array.isArray(parsed)) {
    throw new Error('CA_DIGEST_SOURCES must be a JSON array');
  }

  return parsed.map((source) => ({
    ...source,
    enabled: source.enabled !== false,
  }));
}

export function resolveCaSources(envSourcesJson) {
  const fromEnv = envSourcesJson ? parseCaSourcesFromEnv(envSourcesJson) : null;
  return fromEnv ?? DEFAULT_CA_SOURCES.filter((source) => source.enabled);
}
