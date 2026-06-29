# Over-the-air updates & safe releases

Sopaan ships **JS-only fixes** via [EAS Update](https://docs.expo.dev/eas-update/introduction/) and **native/breaking changes** via store builds with a server-driven **force update** gate.

## Architecture

```
Store build (EAS Build)          EAS Update (OTA)
─────────────────────           ──────────────────
Native binary pinned to         JS bundle on same
runtimeVersion = appVersion     runtimeVersion channel
        │                                │
        └──────────┬─────────────────────┘
                   ▼
           ReleaseGate (app launch)
           1. GET /api/app/version-requirements
           2. Force update if native < min
           3. expo-updates fetch + reload if OTA available
```

## Channels

| Channel | Build profile | API / env | Purpose |
|---------|---------------|-----------|---------|
| `development` | `development` | local | Dev client |
| `staging` | `staging` | staging API | QA before prod OTA |
| `production` | `production` | production API | Live users |
| `e2e` | `e2e-android` / `e2e-ios` | E2E stub API | CI only |

Build profiles set `channel` in `eas.json`. OTA publishes target the same channel so only matching binaries receive updates.

## First-time setup

1. Install EAS CLI: `npm i -g eas-cli`
2. Log in: `eas login`
3. Link project: `cd mobile && eas init`
4. Copy project ID to `mobile/.env`:
   ```env
   EAS_PROJECT_ID=<uuid-from-expo-dashboard>
   ```
5. Build store binaries **before** first OTA:
   ```bash
   eas build --profile staging --platform android
   eas build --profile production --platform all
   ```

`app.config.js` enables `expo-updates` when `EAS_PROJECT_ID` is set.

## Shipping a JS-only fix (no store review)

1. Merge fix to `main`
2. Publish to **staging** first:
   ```bash
   cd mobile
   npm run update:staging -- "fix: quiz timer edge case"
   ```
3. Verify on a staging build installed from EAS
4. Publish to **production**:
   ```bash
   npm run update:production -- "fix: quiz timer edge case"
   ```

Requirements for OTA (no store submission):

- No native dependency changes (`expo install` / new native modules)
- No change to `app.json` version (runtimeVersion policy = `appVersion`)
- Same major native capabilities as the build that installed the app

## Staged rollouts

Roll out gradually to catch regressions before 100% of users:

```bash
# 10% of production channel devices
npm run update:rollout-10 -- "fix: payment copy"

# Increase to 50%
npm run update:rollout-50 -- "fix: payment copy"

# Full channel (100%) — use production profile without rollout flag
npm run update:production -- "fix: payment copy"
```

Or use EAS dashboard → Updates → edit rollout percentage.

## Rollback

If an OTA causes issues:

```bash
cd mobile && npm run update:rollback
# or: eas update:rollback --channel production
```

This repoints the channel to the previous update group. Users receive the rollback on next app launch.

For a **bad store build**, ship a new store version and bump `APP_MIN_NATIVE_VERSION` (see force update).

## Force update (native / breaking)

When a store build is required, the API enforces a minimum native version.

### Server env (per environment)

| Variable | Example | Purpose |
|----------|---------|---------|
| `APP_MIN_NATIVE_VERSION` | `0.2.0` | Block older binaries |
| `APP_LATEST_NATIVE_VERSION` | `0.2.0` | Shown in force-update UI |
| `APP_UPDATE_CHANNEL` | `production` | Hint for ops (logged by clients) |
| `APP_FORCE_UPDATE_MESSAGE` | custom copy | User-facing message |
| `APP_ANDROID_STORE_URL` | Play Store link | Open on Android |
| `APP_IOS_STORE_URL` | App Store link | Open on iOS |
| `APP_ENFORCE_MIN_VERSION` | `false` | If `true`, API returns 426 for old clients |

Endpoint: `GET /api/app/version-requirements?platform=android&nativeVersion=0.1.0`

### Mobile behaviour

On launch, `ReleaseGate`:

1. Calls version requirements with `x-app-native-version` headers
2. Shows **ForceUpdateScreen** when `forceUpdate: true`
3. Otherwise checks EAS Update and reloads if a bundle is available

### Release checklist for native breaking change

1. Bump `version` in `app.json` (e.g. `0.1.0` → `0.2.0`)
2. `eas build --profile production --platform all`
3. Submit to stores
4. After store approval, set on production API:
   ```env
   APP_MIN_NATIVE_VERSION=0.2.0
   APP_LATEST_NATIVE_VERSION=0.2.0
   ```
5. Old binaries see force-update screen; new binaries continue receiving OTA on `0.2.0` runtime

## CI

`.github/workflows/eas-update.yml` — manual `workflow_dispatch` to publish staging/production updates (requires `EXPO_TOKEN` secret).

## Runtime version policy

`runtimeVersion.policy: appVersion` — OTA updates only apply to builds with the **same app version** as the published bundle. When you bump `app.json` `version`, you must ship a new store build before OTA works again for that line.

## Related

- [E2E.md](./E2E.md) — Maestro tests (separate `e2e` channel)
- [../server/docs/STAGING.md](../server/docs/STAGING.md) — staging API setup
