# Staging environment

Staging mirrors **production topology** with **isolated data and credentials** so you can test deploys, migrations, and disaster-recovery restores safely.

## Goals

- Same runtime as prod: `NODE_ENV=production`, Redis enabled, observability on
- Different identity: `DEPLOY_ENV=staging`, separate MongoDB cluster, Razorpay test keys
- Mobile app points at staging API via `EXPO_PUBLIC_API_URL`

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Mobile (staging│────▶│  API (staging)   │────▶│ Atlas staging   │
│  EXPO_PUBLIC_   │     │  DEPLOY_ENV=     │     │ cluster         │
│  API_URL)       │     │  staging         │     └─────────────────┘
└─────────────────┘     │  NODE_ENV=       │     ┌─────────────────┐
                        │  production      │────▶│ Redis staging   │
                        └──────────────────┘     └─────────────────┘
```

Production uses the same shape with `DEPLOY_ENV=production` and separate Atlas/Redis instances.

## Server setup

1. Copy the staging env template:

   ```bash
   cp server/.env.staging.example server/.env.staging
   ```

2. Fill values from your secret manager (never commit `.env.staging`).

3. Create a **dedicated Atlas cluster** (e.g. `sopaan-staging`, M10 or shared tier with backup enabled for DR drills).

4. Provision **staging Redis** (Upstash, ElastiCache, or Redis Cloud — separate from prod).

5. Use **Razorpay test** keys and a test webhook URL pointing at staging.

6. Set Sentry environment explicitly:

   ```env
   SENTRY_ENVIRONMENT=staging
   ```

7. Start the API:

   ```bash
   cd server
   set -a && source .env.staging && set +a
   npm start
   ```

   Or inject env vars via your host (Railway, Render, ECS, etc.).

   See [DEPLOY.md](./DEPLOY.md) for Docker, `PROCESS_ROLE`, and BullMQ worker setup.

8. Confirm health:

   ```bash
   curl -s https://staging-api.sopaan.app/api/health | jq
   # deployEnv should be "staging"
   ```

## Mobile setup

1. Copy `mobile/.env.staging.example` to `mobile/.env.staging` (gitignored).
2. Set staging API origin:

   ```env
   EXPO_PUBLIC_API_URL=https://staging-api.sopaan.app
   ```

3. Run against staging:

   ```bash
   cd mobile
   cp .env.staging .env   # or use dotenv-cli / EAS env
   npx expo start
   ```

For EAS builds, define a **staging profile** with `EXPO_PUBLIC_API_URL` in EAS secrets — do not reuse production URLs.

## Data seeding

Staging should not use production data unless restored intentionally for DR drills.

```bash
cd server
MONGODB_URI="<staging-uri>" npm run seed
```

After a DR restore drill, run `npm run backup:verify-restore` before sharing staging with QA.

## Parity checklist

| Component | Production | Staging |
|-----------|------------|---------|
| `NODE_ENV` | `production` | `production` |
| `DEPLOY_ENV` | `production` | `staging` |
| MongoDB cluster | Prod Atlas | Staging Atlas |
| Redis | Prod instance | Staging instance |
| Razorpay | Live keys | Test keys |
| `CLIENT_URL` | Prod app URL | Staging / Expo dev URL |
| Sentry | `production` | `staging` |
| JWT secrets | Unique | Unique (never reuse prod) |
| Backups | Cloud Backup + logical | Cloud Backup; DR drill target |

## Promotion workflow

1. Merge to `main` → deploy to **staging** automatically (when CI/CD is wired).
2. Run smoke tests + optional load spot-check.
3. Manual approval → deploy same artifact to **production**.
4. Never run destructive scripts against staging URI without confirming `DEPLOY_ENV`.

## Related

- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)
- [BACKUP_RESTORE_RUNBOOK.md](./BACKUP_RESTORE_RUNBOOK.md)
