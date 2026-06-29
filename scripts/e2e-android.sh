#!/usr/bin/env bash
# Build debug APK and run Maestro flows against a local E2E API (CI or developer machine).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="${ROOT_DIR}/server"
MOBILE_DIR="${ROOT_DIR}/mobile"
API_PORT="${E2E_API_PORT:-4000}"
MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/sopaan_e2e}"
SIGNUP_EMAIL="${E2E_SIGNUP_EMAIL:-e2e-$(date +%s)@sopaan.dev}"

export E2E_STUB_AI=true
export E2E_MODE=true
export E2E_SANDBOX_PAYMENTS=true
export REDIS_ENABLED=false
export NODE_ENV=development
export DEPLOY_ENV=e2e
export PORT="${API_PORT}"
export MONGODB_URI
export JWT_SECRET="${JWT_SECRET:-e2e-jwt-secret-minimum-32-characters-long}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-e2e-jwt-refresh-secret-min-32-chars}"
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-e2e-stub-key}"
export CLIENT_URL="${CLIENT_URL:-http://localhost:8081}"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "${SERVER_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "[e2e] Seeding database…"
(cd "${SERVER_DIR}" && npm run seed)

echo "[e2e] Starting API on :${API_PORT}…"
(cd "${SERVER_DIR}" && npm start) &
SERVER_PID=$!

for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:${API_PORT}/api/health" >/dev/null; then
    echo "[e2e] API ready"
    break
  fi
  sleep 1
done

if ! curl -sf "http://127.0.0.1:${API_PORT}/api/health" >/dev/null; then
  echo "[e2e] API failed to start" >&2
  exit 1
fi

echo "[e2e] Building Android debug APK…"
(
  cd "${MOBILE_DIR}"
  export EXPO_PUBLIC_API_URL="http://10.0.2.2:${API_PORT}"
  export EXPO_PUBLIC_E2E_SANDBOX=true
  npm run e2e:build:android
)

APK="${MOBILE_DIR}/android/app/build/outputs/apk/debug/app-debug.apk"
if [[ ! -f "${APK}" ]]; then
  echo "[e2e] APK not found at ${APK}" >&2
  exit 1
fi

echo "[e2e] Installing APK…"
adb install -r "${APK}"

if ! command -v maestro >/dev/null 2>&1; then
  echo "[e2e] Installing Maestro CLI…"
  curl -Ls "https://get.maestro.mobile.dev" | bash
  export PATH="${PATH}:${HOME}/.maestro/bin"
fi

echo "[e2e] Running Maestro flows…"
(
  cd "${MOBILE_DIR}"
  maestro test .maestro/flows/smoke-logged-in.yaml \
    .maestro/flows/05-premium-paywall-sandbox.yaml \
    --env "E2E_SIGNUP_EMAIL=${SIGNUP_EMAIL}"
)

if [[ "${E2E_RUN_ONBOARDING:-true}" == "true" ]]; then
  maestro test .maestro/flows/01-onboarding-to-home.yaml \
    --env "E2E_SIGNUP_EMAIL=${SIGNUP_EMAIL}"
fi

echo "[e2e] All flows passed"
