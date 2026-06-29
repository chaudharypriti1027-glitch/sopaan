#!/usr/bin/env bash
# Restore MongoDB from a mongodump gzip archive.
# ALWAYS test on staging first — see server/docs/BACKUP_RESTORE_RUNBOOK.md.
#
# Usage:
#   cd server && npm run backup:restore -- ./backups/mongodb/20250626T020000Z/sopaan.archive.gz
#   MONGODB_URI=mongodb+srv://... npm run backup:restore -- /path/to/sopaan.archive.gz
#
# Options (env):
#   RESTORE_DROP=true   Drop existing collections before restore (destructive)
#   RESTORE_NS_FROM=sopaan  Source database name in archive (optional)
#   RESTORE_NS_TO=sopaan_staging_restore  Target database name (optional)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$SERVER_DIR"

ARCHIVE="${1:-}"
if [[ -z "${ARCHIVE}" ]] || [[ ! -f "${ARCHIVE}" ]]; then
  echo "Usage: $0 <path/to/sopaan.archive.gz>" >&2
  exit 1
fi

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${MONGODB_URI:?Set MONGODB_URI (target cluster) in server/.env or the environment}"

if ! command -v mongorestore >/dev/null 2>&1; then
  echo "[restore] ERROR: mongorestore not found. Install MongoDB Database Tools." >&2
  exit 1
fi

RESTORE_ARGS=(--uri="${MONGODB_URI}" --gzip --archive="${ARCHIVE}" --stopOnError)

if [[ "${RESTORE_DROP:-false}" == "true" ]]; then
  RESTORE_ARGS+=(--drop)
  echo "[restore] WARNING: RESTORE_DROP=true — existing collections will be dropped"
fi

if [[ -n "${RESTORE_NS_FROM:-}" ]] && [[ -n "${RESTORE_NS_TO:-}" ]]; then
  RESTORE_ARGS+=(--nsFrom="${RESTORE_NS_FROM}.*" --nsTo="${RESTORE_NS_TO}.*")
  echo "[restore] Namespace remap: ${RESTORE_NS_FROM} → ${RESTORE_NS_TO}"
fi

echo "[restore] Target host: $(node -e "try{const u=new URL(process.argv[1].replace(/^mongodb(\+srv)?:/,'https:'));console.log(u.hostname)}catch{console.log('unknown')}" "${MONGODB_URI}")"
echo "[restore] Archive: ${ARCHIVE}"

mongorestore "${RESTORE_ARGS[@]}"

echo "[restore] Complete. Run: npm run backup:verify-restore"
