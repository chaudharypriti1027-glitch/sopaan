/**
 * Disaster recovery targets and backup policy defaults.
 * Override via environment where noted in server/docs/DISASTER_RECOVERY.md.
 */
export const drConfig = Object.freeze({
  /** Recovery Time Objective — max acceptable downtime */
  rtoMinutes: Number(process.env.DR_RTO_MINUTES ?? 60),
  /** Recovery Point Objective — max acceptable data loss */
  rpoMinutes: Number(process.env.DR_RPO_MINUTES ?? 15),
  /** How often logical backups (mongodump) should run when not relying on Atlas alone */
  logicalBackupCron: process.env.DR_LOGICAL_BACKUP_CRON ?? '0 2 * * *',
  /** Days to retain logical backup artifacts (S3/local) */
  logicalBackupRetentionDays: Number(process.env.DR_BACKUP_RETENTION_DAYS ?? 30),
  /** Atlas: enable Cloud Backup / continuous backup on M10+ clusters */
  atlasContinuousBackupRecommended: true,
  /** Collections checked during restore verification */
  verifyCollections: Object.freeze([
    'users',
    'attempts',
    'tests',
    'questions',
    'paymentorders',
    'subscriptionentitlements',
  ]),
  /** Minimum document count per collection (0 = collection must exist only) */
  verifyMinCounts: Object.freeze({
    users: 0,
    attempts: 0,
    tests: 0,
    questions: 0,
  }),
});
