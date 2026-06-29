#!/usr/bin/env bash
set -euo pipefail

find_jdk_home() {
  local candidate

  for candidate in \
    "${JAVA_HOME:-}" \
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
    "$(/usr/libexec/java_home -v 21 2>/dev/null || true)" \
    "$(/usr/libexec/java_home -v 17 2>/dev/null || true)" \
    "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" \
    "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" \
    "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"; do
    if [ -n "$candidate" ] && [ -x "$candidate/bin/javac" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

if ! JDK_HOME="$(find_jdk_home)"; then
  cat >&2 <<'EOF'
JDK 17+ is required to build the Android app.

Install one of:
  • Android Studio (recommended) — includes a bundled JDK
  • Homebrew: brew install --cask temurin@17

Then rerun: npm run android
EOF
  exit 1
fi

export JAVA_HOME="$JDK_HOME"
export PATH="$JAVA_HOME/bin:$PATH"

find_android_sdk() {
  local candidate

  for candidate in \
    "${ANDROID_HOME:-}" \
    "${ANDROID_SDK_ROOT:-}" \
    "$HOME/Library/Android/sdk" \
    "$HOME/Android/Sdk"; do
    if [ -n "$candidate" ] && [ -d "$candidate/platform-tools" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

if ANDROID_SDK="$(find_android_sdk)"; then
  export ANDROID_HOME="$ANDROID_SDK"
  export ANDROID_SDK_ROOT="$ANDROID_SDK"
  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

  LOCAL_PROPS="$(cd "$(dirname "$0")/.." && pwd)/android/local.properties"
  if [ ! -f "$LOCAL_PROPS" ] || ! grep -q "^sdk.dir=" "$LOCAL_PROPS" 2>/dev/null; then
    mkdir -p "$(dirname "$LOCAL_PROPS")"
    printf 'sdk.dir=%s\n' "$ANDROID_SDK" > "$LOCAL_PROPS"
  fi
else
  cat >&2 <<'EOF'
Android SDK not found.

Install Android Studio, then open SDK Manager and install:
  • Android SDK Platform 35
  • Android SDK Build-Tools 35
  • Android SDK Platform-Tools

Expected SDK path on macOS: ~/Library/Android/sdk
EOF
  exit 1
fi

exec "$@"
