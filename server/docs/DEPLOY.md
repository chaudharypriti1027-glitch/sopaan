# Deploying the Sopaan API

Reproducible container builds live in `server/Dockerfile`. Local full stack: `docker compose up` from the repo root (API + MongoDB + Redis + BullMQ worker).

## Process roles

Background jobs must not run on every API replica. Use `PROCESS_ROLE`:

| Role            | Entrypoint           | HTTP | BullMQ repeatables | BullMQ worker | node-cron fallback  |
| --------------- | -------------------- | ---- | ------------------ | ------------- | ------------------- |
| `all` (default) | `node src/index.js`  | yes  | yes                | yes           | yes (if Redis down) |
| `api`           | `node src/index.js`  | yes  | no                 | no            | no                  |
| `worker`        | `node src/worker.js` | no   | yes                | yes           | yes (if Redis down) |
| `scheduler`     | `node src/worker.js` | no   | yes                | no            | no                  |

**Production (recommended):** one or more `api` services + one `worker` service (scale workers for throughput). Repeatable cron schedules are registered by the worker on startup (idempotent `jobId` per job).

AI book generation specifically requires `REDIS_URL`, `JOBS_ENABLED=true`, and a process running `node src/worker.js` with `PROCESS_ROLE=worker`. Book jobs use bounded exponential retries and expose `queued`, `running`, `done`, or `failed` through the admin status endpoint.

**Local Docker Compose:** `api` runs with `PROCESS_ROLE=api`; `worker` runs `node src/worker.js` with `PROCESS_ROLE=worker`.

## Local Docker

```bash
# From repo root
cp server/.env.docker.example server/.env.docker   # optional local overrides
docker compose up --build

# Health
curl -s http://localhost:4000/api/health | jq

# Seed database (first time)
docker compose run --rm api node src/seed/index.js
```

Point the mobile app at `http://localhost:4000` (or `http://10.0.2.2:4000` on Android emulator).

### Build image only

```bash
# From repo root (lockfile-pinned monorepo install)
docker build -f Dockerfile -t sopaan-api:local .

# From server/ (matches Render / Railway when root directory is server)
docker build -t sopaan-api:local .
```

## Environment variables

Copy `server/.env.example` for the full list. Minimum for containers:

| Variable                            | Required             | Notes                                                                                                  |
| ----------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| `PORT`                              | yes                  | Default `4000`                                                                                         |
| `MONGODB_URI`                       | yes                  | Atlas or `mongodb://…`                                                                                 |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | yes                  | ≥32 chars, must differ                                                                                 |
| `NODE_ENV`                          | yes                  | `production` in prod                                                                                   |
| `CLIENT_URL`                        | yes                  | CORS origin (Expo / web)                                                                               |
| `REDIS_URL`                         | prod                 | Enables cache, rate limits, BullMQ                                                                     |
| `REDIS_ENABLED`                     | prod                 | Set `true` when Redis is provisioned                                                                   |
| `PROCESS_ROLE`                      | prod                 | `api` on API service, `worker` on worker service                                                       |
| `JOBS_ENABLED`                      | optional             | Default `true`; set `false` to disable all jobs                                                        |
| `ANTHROPIC_API_KEY`                 | AI in prod           | Without it the API still boots, but AI calls return `AI_UNAVAILABLE`; `DEV_STUB_AI` is local/test only |
| `NEWSAPI_AI_KEY`                    | live current affairs | Without it external news ingestion returns a structured `503`; stored current affairs remain available |
| `SENTRY_DSN`                        | prod                 | Error tracking                                                                                         |
| `RAZORPAY_*`                        | prod                 | Payments + webhook secret                                                                              |

See also [STAGING.md](./STAGING.md) for staging-specific wiring.

## Production deploy paths

All platforms use the Sopaan API container image.

| Deploy target              | Root directory        | Dockerfile path                      |
| -------------------------- | --------------------- | ------------------------------------ |
| Render (see `render.yaml`) | `server`              | `Dockerfile`                         |
| Railway / similar          | `server`              | `Dockerfile`                         |
| Monorepo / Compose         | `server` or repo root | `server/Dockerfile` or `/Dockerfile` |

**Important:** Root directory must match the Dockerfile. `server/Dockerfile` expects context `server/` (`package.json`, `src/`). Root `/Dockerfile` expects the monorepo root (`server/src`, `package-lock.json`). A mismatch causes `"/server/src": not found`.

### Render (recommended for simplicity)

Use the included `render.yaml` blueprint, or configure manually:

1. **New Web Service** — Docker, connect repo, set **root directory** `server`, **Dockerfile path** `Dockerfile`.
2. **Environment** — add secrets from the table above; `PROCESS_ROLE=api`, `NODE_ENV=production`.
3. **Managed MongoDB** (Render or Atlas) → `MONGODB_URI`.
4. **Managed Redis** (Render Key Value or Upstash) → `REDIS_URL`, `REDIS_ENABLED=true`.
5. **Background Worker** — duplicate the service (or “Background Worker” type):
   - Same Docker image
   - **Start command:** `node src/worker.js`
   - `PROCESS_ROLE=worker`
   - No public HTTP port
6. Deploy API first, then worker. Run seed once via Render shell: `node src/seed/index.js`.

### Railway

1. Create project from repo; add **MongoDB** and **Redis** plugins.
2. **API service:** root directory `server`, Dockerfile `Dockerfile`, start `node src/index.js`, `PROCESS_ROLE=api`.
3. **Worker service:** same image, start `node src/worker.js`, `PROCESS_ROLE=worker`.
4. Map plugin URLs to `MONGODB_URI` and `REDIS_URL` via Railway variables.

### Fly.io

```bash
# API app
fly launch --dockerfile server/Dockerfile --no-deploy
fly secrets set MONGODB_URI=... JWT_SECRET=... JWT_REFRESH_SECRET=... REDIS_URL=... PROCESS_ROLE=api
fly deploy

# Worker app (separate fly.toml / app name)
fly apps create sopaan-worker
fly secrets set ... PROCESS_ROLE=worker
fly deploy --config fly.worker.toml
```

`fly.worker.toml` example:

```toml
app = "sopaan-worker"
primary_region = "bom"

[build]
  dockerfile = "server/Dockerfile"

[processes]
  worker = "node src/worker.js"

[[vm]]
  processes = ["worker"]
```

## Job scheduler behavior

With **Redis available** (production):

- Repeatable schedules (daily plan, streak reminders, CA digest, etc.) are stored in BullMQ.
- The **worker** process executes jobs; API replicas do not run handlers.
- Cron patterns and timezone: `server/src/config/jobConfig.js` (`JOBS_TIMEZONE`, `JOB_CRON_*` overrides).

Without **Redis** (not recommended in prod):

- Falls back to **node-cron** inside processes with `PROCESS_ROLE=all` or `worker` only.

Disable all jobs: `JOBS_ENABLED=false`.

## Health checks

- HTTP: `GET /api/health` (used by Docker `HEALTHCHECK`)
- Configure the same path on Render/Railway/Fly load balancers.

## CI

Image build is validated implicitly via `docker compose build` locally. Production deploys should pin image digests or release tags after CI passes (`npm run test -w @sopaan/server`).
