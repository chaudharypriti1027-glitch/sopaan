# Disaster recovery (DR)

Sopaan targets **RTO 60 minutes** and **RPO 15 minutes** for production MongoDB data. Override defaults with `DR_RTO_MINUTES` and `DR_RPO_MINUTES` on the API host.

| Metric | Target | Meaning |
|--------|--------|---------|
| **RTO** | 60 min | Max time to restore API + database after a major outage |
| **RPO** | 15 min | Max acceptable data loss (Atlas continuous backup window) |

## Backup strategy (layered)

### 1. MongoDB Atlas Cloud Backup (primary)

Use a dedicated **M10+** (or Flex with backup enabled) cluster for production.

1. Atlas → **Project** → **Backup** → enable **Cloud Backup** (continuous).
2. Set **retention**: minimum 30 days daily snapshots; 7-day point-in-time restore (PITR) window aligns with RPO 15m on M10+.
3. Create a **read-only Atlas API key** for restore drills (store in secret manager).
4. Restrict network access: IP allowlist + VPC peering where possible.
5. **Separate clusters** for production and staging — never share `MONGODB_URI` across `DEPLOY_ENV`.

Atlas PITR is the fastest path for accidental deletes or corruption within the retention window.

### 2. Logical backups (mongodump — secondary)

Nightly `mongodump` archives provide vendor-independent copies and long-term retention in your object store.

```bash
cd server
npm run backup:mongodb
# Upload ./backups/mongodb/<timestamp>/ to encrypted S3/GCS (SSE-KMS)
```

Schedule via cron on a backup host or CI (see `.github/workflows/backup-verify.yml`).

| Setting | Default | Purpose |
|---------|---------|---------|
| `DR_LOGICAL_BACKUP_CRON` | `0 2 * * *` | Documented schedule (UTC) |
| `DR_BACKUP_RETENTION_DAYS` | `30` | Local/archive retention |
| `BACKUP_OUTPUT_DIR` | `./backups/mongodb` | Output path |

### 3. Secrets & config backup

Application secrets are **not** in MongoDB. Back them up via your secret manager with **versioning** enabled.

```bash
cd server && npm run backup:secrets-inventory
```

See `config/secrets-backup-manifest.json` and [SECURITY.md](./SECURITY.md).

## Environments

| `DEPLOY_ENV` | MongoDB | Redis | Razorpay | Purpose |
|--------------|---------|-------|----------|---------|
| `development` | Local / dev cluster | Optional | Test | Local dev |
| `staging` | **Separate** Atlas cluster | Dedicated instance | Test keys | Pre-prod validation, restore drills |
| `production` | Prod Atlas + Cloud Backup | Prod Redis | Live keys | Customer traffic |

Staging must mirror production **topology** (same Node version, Redis enabled, `NODE_ENV=production`) but use **isolated** data and keys. See [STAGING.md](./STAGING.md).

## Restore drill cadence

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Atlas PITR restore to **staging** cluster | Monthly | Platform |
| `mongodump` → restore → `verify-restore` on staging | Monthly | Platform |
| Secrets inventory review | Quarterly | Security |
| Full DR tabletop (RTO/RPO) | Quarterly | Engineering |

Record drill date and outcome in your internal change log.

## Failure scenarios

| Scenario | Primary response | RTO impact |
|----------|------------------|------------|
| Single API instance crash | Auto-restart / load balancer | Minutes |
| Redis unavailable | Failover to replica; sessions may reset | 15–30 min |
| MongoDB region outage | Atlas multi-region or restore to new cluster | 30–60 min |
| Accidental data delete | Atlas PITR to staging, validate, promote | 30–60 min |
| Secret compromise | Rotate via secret manager; redeploy all envs | 30–60 min |

Detailed steps: [BACKUP_RESTORE_RUNBOOK.md](./BACKUP_RESTORE_RUNBOOK.md).

## Health check

`GET /api/health` returns `deployEnv`, MongoDB connection state, and DR targets for monitoring:

```json
{
  "status": "ok",
  "deployEnv": "production",
  "mongodb": "connected",
  "dr": { "rtoMinutes": 60, "rpoMinutes": 15 }
}
```

Alert if `status` is `degraded` or `mongodb` is not `connected` in production.

## Related docs

- [BACKUP_RESTORE_RUNBOOK.md](./BACKUP_RESTORE_RUNBOOK.md) — step-by-step restore
- [STAGING.md](./STAGING.md) — staging environment setup
- [SECURITY.md](./SECURITY.md) — secrets handling
