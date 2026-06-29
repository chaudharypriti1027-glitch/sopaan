#!/usr/bin/env bash
# Logical MongoDB backup via mongodump (gzip archive).
# Primary DR: MongoDB Atlas Cloud Backup — see server/docs/DISASTER_RECOVERY.md.
#
# Usage:
#   cd server && npm run backup:mongodb
#   BACKUP_OUTPUT_DIR=/var/backups/sopaan npm run backup:mongodb
#
# Requires: mongodump (MongoDB Database Tools), MONGODB_URI in .env or environment.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$SERVER_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${MONGODB_URI:?Set MONGODB_URI in server/.env or the environment}"

BACKUP_DIR="${BACKUP_OUTPUT_DIR:-./backups/mongodb}"
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
DEST="${BACKUP_DIR}/${TIMESTAMP}"
ARCHIVE="${DEST}/sopaan.archive.gz"
RETENTION_DAYS="${DR_BACKUP_RETENTION_DAYS:-30}"

mkdir -p "$DEST"

if ! command -v mongodump >/dev/null 2>&1; then
  echo "[backup] ERROR: mongodump not found. Install MongoDB Database Tools:" >&2
  echo "  https://www.mongodb.com/docs/database-tools/installation/" >&2
  exit 1
fi

echo "[backup] Starting mongodump → ${ARCHIVE}"
mongodump --uri="${MONGODB_URI}" --gzip --archive="${ARCHIVE}"

BYTES="$(wc -c < "${ARCHIVE}" | tr -d ' ')"
echo "[backup] Complete (${BYTES} bytes)"

# Metadata for restore runbook / automation
cat > "${DEST}/manifest.json" <<EOF
{
  "createdAt": "${TIMESTAMP}",
  "tool": "mongodump",
  "archive": "sopaan.archive.gz",
  "retentionDays": ${RETENTION_DAYS},
  "sourceUriHost": "$(node -e "try{const u=new URL(process.argv[1].replace(/^mongodb(\+srv)?:/,'https:'));console.log(u.hostname)}catch{console.log('unknown')}" "${MONGODB_URI}")"
}
EOF

# Prune old logical backups
if [[ "${RETENTION_DAYS}" -gt 0 ]] && [[ -d "${BACKUP_DIR}" ]]; then
  find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d -mtime "+${RETENTION_DAYS}" -print -exec rm -rf {} + 2>/dev/null || true
  echo "[backup] Pruned directories older than ${RETENTION_DAYS} days under ${BACKUP_DIR}"
fi

echo "[backup] Next: upload ${DEST} to encrypted object storage (S3/GCS) — never commit archives to git."
