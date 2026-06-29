# Backup & restore runbook

Use this runbook for **tested restores** on **staging** before any production recovery. Production restores require incident commander approval.

## Prerequisites

- MongoDB Database Tools (`mongodump`, `mongorestore`) installed locally or on a jump host
- Atlas **Project Owner** or **Backup Manager** role for PITR restores
- Staging cluster URI (`MONGODB_URI` with `DEPLOY_ENV=staging`)
- Access to encrypted backup bucket (logical archives)

## Quick reference

| Goal | Method | Command / location |
|------|--------|-------------------|
| Nightly logical backup | mongodump | `cd server && npm run backup:mongodb` |
| Restore logical backup | mongorestore | `npm run backup:restore -- ./backups/mongodb/<ts>/sopaan.archive.gz` |
| Verify after restore | Node script | `npm run backup:verify-restore` |
| Point-in-time recovery | Atlas UI / API | Atlas → Backup → Restore |
| List secrets to back up | Inventory | `npm run backup:secrets-inventory` |

---

## A. Atlas continuous backup — point-in-time restore (preferred)

**When:** Accidental delete, bad migration, corruption within PITR window.  
**Target:** Staging cluster first, then production after validation.

### Steps

1. **Declare incident** — note approximate time of bad write (UTC).
2. Atlas → **Database** → **Backup** → **Restore**.
3. Choose **Point in Time** → select timestamp **1–2 minutes before** the incident.
4. Restore to a **new cluster** or **staging cluster** (never overwrite prod until verified).
5. Update staging `MONGODB_URI` to the restored cluster (or use temporary URI).
6. Deploy API to staging with `DEPLOY_ENV=staging`, `NODE_ENV=production`.
7. Run verification:

   ```bash
   cd server
   MONGODB_URI="<restored-uri>" npm run backup:verify-restore
   npm run verify:indexes
   npm run test
   ```

8. Smoke test: login, start quiz, submit attempt, check payments webhook (test mode).
9. **Production cutover** (if staging validates):
   - Maintenance window: scale API to 0 or enable read-only mode if available.
   - Point production `MONGODB_URI` to restored cluster (or rename/promote cluster per Atlas docs).
   - Scale API up; monitor Sentry and `/api/health`.
10. Post-incident: document root cause, actual RTO/RPO achieved.

**Expected duration:** 20–45 minutes to staging; +15–30 minutes for prod cutover.

---

## B. Logical backup restore (mongodump archive)

**When:** Long-term archive, cross-cloud migration, or Atlas backup unavailable.

### B1. Restore to staging (monthly drill)

```bash
cd server

# Use staging URI — never prod for first pass
export MONGODB_URI="mongodb+srv://staging-user:****@staging-cluster/sopaan"
export DEPLOY_ENV=staging

# Optional: restore into isolated DB name
export RESTORE_NS_FROM=sopaan
export RESTORE_NS_TO=sopaan_restore_drill
# export RESTORE_DROP=true   # only if replacing empty target DB

npm run backup:restore -- ./backups/mongodb/20250626T020000Z/sopaan.archive.gz
npm run backup:verify-restore
```

### B2. Restore to production (break-glass)

1. Incident approval obtained.
2. `RESTORE_DROP=true` only if replacing entire database — **irreversible**.
3. Restore during maintenance window.
4. Run `verify-restore`, `verify:indexes`, smoke tests.
5. Re-enable traffic.

```bash
export MONGODB_URI="<production-uri>"
export RESTORE_DROP=true   # destructive — confirm twice
npm run backup:restore -- /secure/path/sopaan.archive.gz
npm run backup:verify-restore
```

---

## C. Secrets recovery

Secrets are **not** restored from MongoDB backups.

1. Open secret manager → restore previous **version** of each key in `config/secrets-backup-manifest.json`.
2. Redeploy API with restored env vars.
3. If JWT secrets rotated unexpectedly: all users must re-login (invalidate refresh tokens via Redis flush or token version bump if implemented).
4. Rotate compromised keys immediately after service is stable.

```bash
cd server && npm run backup:secrets-inventory
```

Quarterly: export encrypted offline break-glass bundle (two-person rule).

---

## D. Redis recovery

Redis holds ephemeral data (sessions, rate limits, job queues). It is **not** the source of truth.

1. Provision new Redis instance.
2. Update `REDIS_URL` in secret manager.
3. Redeploy API — users re-authenticate; background jobs resume from MongoDB state.

No mongodump equivalent required for RPO on Redis.

---

## E. Verification checklist

After any restore:

- [ ] `npm run backup:verify-restore` exits 0
- [ ] `npm run verify:indexes` exits 0
- [ ] `GET /api/health` → `status: ok`, `mongodb: connected`
- [ ] Auth: signup/login/refresh token flow
- [ ] Core loop: fetch test → submit attempt → view result
- [ ] Payments: create test order (staging keys only)
- [ ] Jobs: confirm cron/BullMQ workers connected (check logs)
- [ ] Sentry: no spike in 5xx errors

---

## F. Automated verification (CI)

`.github/workflows/backup-verify.yml` runs monthly when `STAGING_MONGODB_URI` is configured in GitHub secrets. It connects to staging and runs `verify-restore` (no restore — assumes staging is maintained separately).

To add a full restore drill in CI, store a recent archive in encrypted artifact storage and run `backup:restore` against a disposable cluster only.

---

## Contacts & escalation

| Role | Responsibility |
|------|----------------|
| On-call engineer | Execute runbook, health checks |
| Platform lead | Atlas restore approval, cluster promotion |
| Security | Secret rotation, breach assessment |

Update contact details in your internal ops wiki — do not store phone numbers in this repo.
