import { env } from '../../config/env.js';
import { DEFAULT_LANGUAGE, isSupportedLanguage } from '../../constants/languages.js';
import { resolveCaSources } from '../../config/caSources.js';
import { CurrentAffair } from '../../models/CurrentAffair.js';
import { CurrentAffairDigest } from '../../models/CurrentAffairDigest.js';
import { Question } from '../../models/Question.js';
import { summarizeForAspirants } from '../ai/summarizeForAspirants.js';
import {
  dispatchNotificationToMatchingStudents,
  NOTIFICATION_TYPES,
} from '../notificationService.js';
import { parsePagination, startOfDay } from '../../utils/pagination.js';
import { CACHE_TTLS } from '../../config/cacheConfig.js';
import { cacheGetOrSet, stableCacheKey } from '../../lib/cache.js';
import {
  fetchSyndicationFeed,
  filterRecentFeedItems,
  truncateSnippet,
} from './rssFeedClient.js';

const CATEGORY_COLORS = {
  National: '#3B82F6',
  International: '#6366F1',
  Economy: '#F59E0B',
  Polity: '#8B5CF6',
  Science: '#10B981',
  Defence: '#64748B',
  Schemes: '#EC4899',
  Sports: '#14B8A6',
  Environment: '#22C55E',
  Other: '#94A3B8',
};

function digestTitleForDate(date) {
  return `Daily CA Digest — ${date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

function buildAffairSummaryLine(items) {
  if (!items.length) {
    return 'No new headlines today.';
  }

  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
  return `${items.length} headline${items.length === 1 ? '' : 's'} covering ${categories.join(', ') || 'today\'s news'}.`;
}

async function createAffairFromFeedItem(source, feedItem, aiResult, digestId, language = DEFAULT_LANGUAGE) {
  const questionDocs = await Question.insertMany(
    aiResult.quizQuestions.map((question) => ({
      subject: 'Current Affairs',
      topic: question.topic,
      difficulty: question.difficulty,
      text: question.text,
      options: question.options.map((option) => ({
        key: option.key.toUpperCase(),
        text: option.text,
      })),
      correctKey: question.correctKey.toUpperCase(),
      explanation: question.explanation,
      examTags: ['General'],
      source: 'official',
      language,
      reviewStatus: 'approved',
      qualityCheckedAt: new Date(),
    })),
  );

  const summaryWithAttribution = source.attribution
    ? `${aiResult.summary}\n\n${source.attribution}.`
    : aiResult.summary;

  return CurrentAffair.create({
    title: feedItem.title,
    summary: summaryWithAttribution,
    category: aiResult.category || source.categoryHint || 'National',
    source: source.name,
    sourceUrl: feedItem.link,
    feedSourceId: source.id,
    feedItemId: feedItem.itemId,
    digestId,
    publishedAt: feedItem.publishedAt ?? new Date(),
    imageColor: CATEGORY_COLORS[aiResult.category] ?? CATEGORY_COLORS.Other,
    quizQuestions: questionDocs.map((doc) => doc._id),
    status: 'published',
  });
}

async function processSource(source, digestId, { dryRun = false, language = DEFAULT_LANGUAGE } = {}) {
  if (!source.enabled) {
    return { sourceId: source.id, skipped: true, reason: 'disabled', created: [] };
  }

  let feedItems = [];

  try {
    feedItems = await fetchSyndicationFeed(source.feedUrl);
  } catch (err) {
    console.error(`[ca-digest] feed fetch failed for ${source.id}:`, err.message);
    return { sourceId: source.id, skipped: true, reason: err.message, created: [] };
  }

  const recentItems = filterRecentFeedItems(feedItems, {
    maxAgeHours: source.maxAgeHours ?? 36,
  }).slice(0, source.maxItemsPerRun ?? 5);

  const created = [];

  for (const feedItem of recentItems) {
    const exists = await CurrentAffair.findOne({
      feedSourceId: source.id,
      feedItemId: feedItem.itemId,
    })
      .select('_id')
      .lean();

    if (exists) {
      continue;
    }

    const snippet = truncateSnippet(feedItem.description, source.maxDescriptionChars ?? 500);

    if (dryRun) {
      created.push({ title: feedItem.title, dryRun: true });
      continue;
    }

    try {
      const aiResult = await summarizeForAspirants({
        title: feedItem.title,
        snippet,
        sourceName: source.name,
        sourceUrl: feedItem.link,
        publishedAt: feedItem.publishedAt?.toISOString?.() ?? null,
        language,
      });

      const affair = await createAffairFromFeedItem(source, feedItem, aiResult, digestId, language);
      created.push(affair);
    } catch (err) {
      console.error(`[ca-digest] failed to summarize ${source.id}/${feedItem.itemId}:`, err.message);
    }
  }

  return { sourceId: source.id, created };
}

export async function runDailyCaDigest({
  date = new Date(),
  dryRun = false,
  skipNotification = false,
  language: languageInput,
} = {}) {
  if (!env.caDigestEnabled) {
    return { skipped: true, reason: 'CA digest disabled' };
  }

  const digestLanguage = isSupportedLanguage(languageInput)
    ? languageInput
    : isSupportedLanguage(process.env.CA_DIGEST_LANGUAGE)
      ? process.env.CA_DIGEST_LANGUAGE
      : DEFAULT_LANGUAGE;

  const digestDate = startOfDay(date);
  const sources = resolveCaSources(process.env.CA_DIGEST_SOURCES ?? env.caDigestSourcesJson);

  if (!sources.length) {
    return { skipped: true, reason: 'no enabled sources' };
  }

  let digest = await CurrentAffairDigest.findOne({ digestDate });

  if (!digest && !dryRun) {
    digest = await CurrentAffairDigest.create({
      digestDate,
      title: digestTitleForDate(digestDate),
      summary: '',
      affairs: [],
      itemCount: 0,
      status: 'draft',
    });
  }

  const digestId = digest?._id;
  const perSource = [];

  for (const source of sources) {
    perSource.push(await processSource(source, digestId, { dryRun, language: digestLanguage }));
  }

  const newAffairs = perSource.flatMap((result) => result.created ?? []);
  const affairIds = newAffairs.map((affair) => affair._id ?? affair.id).filter(Boolean);

  if (!dryRun && digest) {
    if (affairIds.length) {
      digest.affairs.push(...affairIds);
      digest.itemCount = digest.affairs.length;
      digest.summary = buildAffairSummaryLine(
        await CurrentAffair.find({ _id: { $in: digest.affairs } })
          .select('category')
          .lean(),
      );
    }

    digest.status = digest.itemCount > 0 ? 'published' : digest.status;
    await digest.save();

    if (!skipNotification && affairIds.length && !digest.notificationSentAt) {
      await sendDailyCaDigestNotification({ date: digestDate, digest });
    }
  }

  return {
    digestDate: digestDate.toISOString(),
    digestId: digestId?.toString(),
    sourcesProcessed: perSource.length,
    newItems: affairIds.length,
    perSource: perSource.map((result) => ({
      sourceId: result.sourceId,
      createdCount: result.created?.length ?? 0,
      skipped: result.skipped ?? false,
      reason: result.reason,
    })),
    dryRun,
  };
}

export async function getDigestForDate(dateInput, pagination = {}) {
  const digestDate = startOfDay(dateInput ?? new Date());
  const { limit, offset } = parsePagination(pagination, { defaultLimit: 20, maxLimit: 50 });
  const dateKey = digestDate.toISOString().slice(0, 10);
  const cacheKey = stableCacheKey('cache:ca:digest', { dateKey, limit, offset });

  return cacheGetOrSet(cacheKey, CACHE_TTLS.caDigestSec, async () => {
    const digest = await CurrentAffairDigest.findOne({
      digestDate,
      status: 'published',
    })
      .populate({
        path: 'affairs',
        select: 'title summary category source sourceUrl publishedAt imageColor quizQuestions',
      })
      .lean();

    if (!digest) {
      return null;
    }

    const allAffairs = digest.affairs ?? [];
    const affairs = allAffairs.slice(offset, offset + limit);

    return {
      id: digest._id.toString(),
      digestDate: digest.digestDate,
      title: digest.title,
      summary: digest.summary,
      itemCount: digest.itemCount,
      affairs,
      pagination: {
        total: allAffairs.length,
        limit,
        offset,
        hasMore: offset + affairs.length < allAffairs.length,
      },
    };
  });
}

export async function getTodayDigest(pagination) {
  return getDigestForDate(new Date(), pagination);
}

export async function sendDailyCaDigestNotification({ date = new Date(), digest: existingDigest } = {}) {
  const digestDate = startOfDay(date);

  const digest =
    existingDigest ??
    (await CurrentAffairDigest.findOne({
      digestDate,
      status: 'published',
    }));

  if (!digest) {
    return { skipped: true, reason: 'no_digest' };
  }

  if (digest.notificationSentAt) {
    return { skipped: true, reason: 'already_notified' };
  }

  if ((digest.itemCount ?? 0) === 0) {
    return { skipped: true, reason: 'empty_digest' };
  }

  const notifyResult = await dispatchNotificationToMatchingStudents(
    {},
    {
      type: NOTIFICATION_TYPES.NEW_CURRENT_AFFAIRS,
      title: 'Daily CA digest is ready',
      body: `${digest.itemCount} new headline${digest.itemCount === 1 ? '' : 's'} — ${digest.title}`,
      data: { digestId: digest._id.toString(), itemCount: digest.itemCount },
    },
  );

  if (notifyResult.pushSent > 0 || notifyResult.inApp > 0) {
    digest.notificationSentAt = new Date();
    await digest.save();
  }

  return {
    sent: notifyResult.pushSent ?? 0,
    inApp: notifyResult.inApp ?? 0,
    digestId: digest._id.toString(),
    itemCount: digest.itemCount,
  };
}
