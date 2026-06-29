# Security

OWASP-oriented controls for the Sopaan API and mobile app.

## Secrets management

**Never commit secrets.** All credentials live in the host secret manager and are injected at runtime:

| Secret | Server env var | Notes |
|--------|----------------|-------|
| JWT access signing key | `JWT_SECRET` | ≥32 chars in production |
| JWT refresh signing key | `JWT_REFRESH_SECRET` | Must differ from access secret |
| MongoDB URI | `MONGODB_URI` | Includes credentials |
| Anthropic API key | `ANTHROPIC_API_KEY` | Server-only |
| Razorpay | `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Server-only |
| Redis | `REDIS_URL` | Server-only |
| Sentry | `SENTRY_DSN` | Server-only (mobile uses public DSN) |

Recommended platforms: AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, Doppler.

### Backup & rotation

1. Run `npm run backup:secrets-inventory` for the full list of env vars to version in your secret manager.
2. Enable **versioning** on all production secrets; export an encrypted quarterly break-glass bundle (two-person rule).
3. Rotate JWT secrets on a schedule; test on **staging** (`DEPLOY_ENV=staging`) before production.
4. Never store secrets in MongoDB backups, git, or unencrypted object storage.

See [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) and [BACKUP_RESTORE_RUNBOOK.md](./BACKUP_RESTORE_RUNBOOK.md).

Mobile bundle contains **no** API keys or JWT secrets. Tokens use Expo SecureStore.

## Authentication

- Access tokens: 15 minutes
- Refresh tokens: 30 days, rotating with reuse detection
- Password policy: 8–128 chars, uppercase + lowercase + digit
- Account lockout: 5 failed logins → 15 minute lock
- Auth rate limits on `/api/auth/*` and OTP endpoints

## Input validation

- Zod on bodies, queries, and `:id` params where enforced
- No raw `req.query` spread into MongoDB filters
- Regex inputs escaped via `escapeRegex()`

## Authorization

- User-owned resources scoped by `req.user._id`
- Route guards: `requireAttemptOwner`, `requirePlannerSessionOwner`, `requireNotificationOwner`

## Transport & headers

- Helmet + HSTS in production
- Strict CORS to `CLIENT_URL`
- HTTPS redirect behind load balancers (`TRUST_PROXY`, `FORCE_HTTPS`)
- JSON body limit 100kb

## Dependency patching

1. Weekly: `npm run audit:deps` in server
2. Dependabot PRs (`.github/dependabot.yml`)
3. Block deploy on high/critical npm audit findings
4. Security patches within 7 days
