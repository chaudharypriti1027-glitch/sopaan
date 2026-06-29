#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Stopping Gradle daemons…"
if [ -x "$ROOT/android/gradlew" ]; then
  (cd "$ROOT/android" && bash "$ROOT/scripts/with-jdk.sh" ./gradlew --stop) 2>/dev/null || true
fi

echo "Removing Android build outputs…"
rm -rf "$ROOT/android/.gradle" "$ROOT/android/build" "$ROOT/android/app/build"
find "$ROOT/../node_modules" -path '*/android/build' -type d -prune -exec rm -rf {} + 2>/dev/null || true

echo "Trimming Gradle caches (keeps downloaded Gradle wrapper)…"
rm -rf \
  "$HOME/.gradle/caches/8.13/transforms" \
  "$HOME/.gradle/caches/build-cache-1" \
  "$HOME/.gradle/caches/journal-1" \
  "$HOME/.gradle/daemon" 2>/dev/null || true

df -h "$HOME" | tail -1
echo "Done. Re-run: npm run android"
