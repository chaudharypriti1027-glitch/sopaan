# Mobile E2E tests (Maestro)

End-to-end tests cover critical user journeys on **Android** (primary CI) and **iOS** (optional macOS job). We use [Maestro](https://maestro.mobile.dev/) for Expo-friendly UI automation without Detox native harness wiring.

## Flows

| Flow | File | Description |
|------|------|-------------|
| Onboarding → Home | `01-onboarding-to-home.yaml` | Exam → goal → profile → signup → Home tab |
| AI test → Quiz → Coach | `02-ai-quiz-result-coach.yaml` | Generate AI test, submit quiz, assert AI coach |
| Ask AI doubt | `03-ask-ai-doubt.yaml` | FAB → doubt → stubbed AI reply |
| Redeem reward | `04-redeem-reward.yaml` | Profile → Rewards → redeem Dark Theme |
| Paywall sandbox | `05-premium-paywall-sandbox.yaml` | Premium UI + sandbox subscribe (no Razorpay sheet) |
| Logged-in smoke | `smoke-logged-in.yaml` | Runs 02–04 sequentially |

Shared login subflow: `_login.yaml` (seed student `student@sopaan.dev` / `Password123`).

## Prerequisites

1. **MongoDB** with seeded data: `cd server && E2E_STUB_AI=true npm run seed`
2. **API** with E2E mode:
   ```bash
   cd server
   E2E_STUB_AI=true E2E_SANDBOX_PAYMENTS=true REDIS_ENABLED=false npm start
   ```
3. **Android emulator** or device with `adb`
4. **Maestro CLI**: `curl -Ls "https://get.maestro.mobile.dev" | bash`
5. **Debug APK** built with E2E env baked in:
   ```bash
   cd mobile
   cp .env.e2e.example .env
   # set EXPO_PUBLIC_API_URL=http://10.0.2.2:4000 for emulator
   npm run e2e:build:android
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

## Run locally

```bash
cd mobile
maestro test .maestro/flows/02-ai-quiz-result-coach.yaml

# Full suite (from repo root, starts API + builds + runs)
./scripts/e2e-android.sh
```

Pass a unique signup email for onboarding:

```bash
maestro test .maestro/flows/01-onboarding-to-home.yaml \
  --env E2E_SIGNUP_EMAIL=e2e-$(date +%s)@sopaan.dev
```

## testIDs

Stable selectors live on shared components (`Button`, `TextField`, `ChipSelect`, `QuizOption`) and critical screens. Maestro falls back to visible text where needed.

## Server E2E mode

When `E2E_STUB_AI=true` or `E2E_MODE=true`:

- AI test generation, doubt solver, and attempt coaching return deterministic stubs (no Claude calls).
- `POST /api/payments/e2e/activate-plan` activates premium without Razorpay (requires `E2E_SANDBOX_PAYMENTS`).

**Never enable E2E mode in production** — `e2eConfig.js` throws if `DEPLOY_ENV=production`.

## CI

`.github/workflows/e2e-mobile.yml` runs on PRs:

- **Android matrix**: API 30 + 34 emulators, MongoDB service, seeded API, Maestro smoke + paywall + onboarding.
- **iOS** (macOS): iPhone 15 simulator when `workflow_dispatch` or on `main`.

## Why Maestro over Detox?

Expo managed app, no existing Detox harness, minimal `testID` coverage at start. Maestro runs against installed APK/IPA with YAML flows and fast iteration. Detox remains an option after `expo prebuild` if you need deep native assertions.

## Seed users

| Email | Password | Purpose |
|-------|----------|---------|
| `student@sopaan.dev` | `Password123` | Main logged-in flows (500 coins) |
| `paywall@sopaan.dev` | `Password123` | Paywall sandbox (trial already used) |

Defined in `server/src/seed/data.js`.
