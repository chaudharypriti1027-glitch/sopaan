# Caching & Redis Strategy

This document describes how Sopaan uses Redis, HTTP cache headers, and MongoDB indexes for scale.

## Redis (`REDIS_URL`)

Redis is optional in development and disabled in tests. When `REDIS_URL` is set, the API uses Redis for:

| Use case | Key pattern | TTL / window | Fallback |
|----------|-------------|--------------|----------|
| Hot read cache | `cache:*` | See below | Direct MongoDB query |
| Refresh token denylist | `deny:refresh:{jti}` | Remaining token lifetime | No revocation |
| User-wide logout | `deny:refresh:user:{userId}` | 30 days | No revocation |
| API rate limit | `rl:api:*` | 15 min / 100 req | In-memory (single instance) |
| AI rate limit | `rl:ai:*` | 1 min / `AI_REQUESTS_PER_MINUTE` | In-memory |
| BullMQ jobs | `bull:sopaan-jobs:*` | N/A | node-cron in-process |

Set `REDIS_ENABLED=false` to force in-memory fallbacks even when `REDIS_URL` is configured.

## Application cache TTLs

All application caches use JSON values and SHA-256 key suffixes for stable lookup.

| Resource | Redis key prefix | Default TTL | HTTP `Cache-Control` |
|----------|------------------|-------------|----------------------|
| Exam list | `cache:exam:list:` | 300s (5 min) | `public, max-age=300, stale-while-revalidate=60` |
| Exam calendar | `cache:exam:calendar:` | 300s | `public, max-age=300, stale-while-revalidate=60` |
| Current affairs list | `cache:ca:list:` | 120s (2 min) | `public, max-age=120, stale-while-revalidate=30` |
| CA digest | `cache:ca:digest:` | 600s (10 min) | `public, max-age=600, stale-while-revalidate=120` |
| Global leaderboard page | `cache:leaderboard:` | 60s | `private, max-age=60, stale-while-revalidate=15` |
| Flashcard deck summaries | `cache:flashcard:decks:` | 300s | none (auth-adjacent content) |

Override TTLs via env:

```bash
CACHE_TTL_EXAM_CALENDAR_SEC=300
CACHE_TTL_EXAM_LIST_SEC=300
CACHE_TTL_CA_LIST_SEC=120
CACHE_TTL_CA_DETAIL_SEC=300
CACHE_TTL_CA_DIGEST_SEC=600
CACHE_TTL_LEADERBOARD_SEC=60
CACHE_TTL_FLASHCARD_DECKS_SEC=300
```

### Invalidation

Caches are TTL-based (cache-aside). Admin publishes expire naturally via TTL; for immediate consistency after content edits, flush matching prefixes:

```bash
redis-cli --scan --pattern 'sopaan:cache:ca:*' | xargs redis-cli del
redis-cli --scan --pattern 'sopaan:cache:exam:*' | xargs redis-cli del
```

Future work: hook admin CRUD services to call `cacheInvalidatePrefix()`.

## Pagination

All list endpoints return:

```json
{
  "items": [],
  "pagination": { "total": 0, "limit": 20, "offset": 0, "hasMore": false }
}
```

Global caps via `parsePagination()`:

- Default `limit`: 20
- Max `limit`: 100 (50 for leaderboard, live classes, flashcard due cards)

Query params: `?limit=20&offset=0`

## Refresh token denylist

Refresh tokens include a `jti` claim. On logout (`POST /api/auth/logout`):

1. Single token: `{ "refreshToken": "..." }` revokes that `jti`
2. Authenticated request: also sets user-wide revocation timestamp (invalidates all older tokens)

Requires Redis for cross-instance enforcement.

## BullMQ job queue

When Redis is available, scheduled jobs run via BullMQ repeatable jobs on queue `sopaan-jobs`. Without Redis, the server falls back to `node-cron` (single-instance only).

## MongoDB indexes

Compound and partial indexes are defined on Mongoose schemas. Verify plans against your database:

```bash
npm run verify:indexes
```

This runs `explain()` on common query patterns and warns on `COLLSCAN`.

## Environment reference

```bash
REDIS_URL=redis://127.0.0.1:6379
REDIS_ENABLED=true
REDIS_KEY_PREFIX=sopaan:
API_RATE_LIMIT_MAX=100
```
