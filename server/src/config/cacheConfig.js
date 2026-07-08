export const CACHE_TTLS = Object.freeze({
  examCalendarSec: Number(process.env.CACHE_TTL_EXAM_CALENDAR_SEC ?? 300),
  examListSec: Number(process.env.CACHE_TTL_EXAM_LIST_SEC ?? 300),
  currentAffairsListSec: Number(process.env.CACHE_TTL_CA_LIST_SEC ?? 120),
  currentAffairDetailSec: Number(process.env.CACHE_TTL_CA_DETAIL_SEC ?? 300),
  caDigestSec: Number(process.env.CACHE_TTL_CA_DIGEST_SEC ?? 600),
  leaderboardSec: Number(process.env.CACHE_TTL_LEADERBOARD_SEC ?? 60),
  searchSec: Number(process.env.CACHE_TTL_SEARCH_SEC ?? 45),
  userStandingSec: Number(process.env.CACHE_TTL_USER_STANDING_SEC ?? 90),
  flashcardDecksSec: Number(process.env.CACHE_TTL_FLASHCARD_DECKS_SEC ?? 300),
  analyticsProgressSec: Number(process.env.CACHE_TTL_ANALYTICS_SEC ?? 60),
});

export const CACHE_HEADERS = Object.freeze({
  examCalendar: { maxAge: 300, swr: 60 },
  examList: { maxAge: 300, swr: 60 },
  currentAffairsList: { maxAge: 120, swr: 30 },
  currentAffairDetail: { maxAge: 300, swr: 60 },
  caDigest: { maxAge: 600, swr: 120 },
  leaderboard: { maxAge: 60, swr: 15, private: true },
  homeFeed: { maxAge: 30, swr: 10, private: true },
  /** Server-side assembled feed cache (see buildHomeFeed.js). */
  homeFeedServerSec: Number(process.env.CACHE_TTL_HOME_FEED_SEC ?? 60),
  search: { maxAge: 45, swr: 15, private: true },
  staticCatalog: { maxAge: 3600, swr: 300 },
});
