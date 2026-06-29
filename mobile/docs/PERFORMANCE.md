# Mobile performance

## Budgets

Screen-level budgets live in `src/perf/budget.ts` and are checked in development via `useScreenPerf` (warns after 3s) and in CI via `npm run test:perf`.

| Screen | First contentful | Time to interactive | Max renders (3s) |
|--------|------------------|---------------------|------------------|
| Home | 800ms | 2000ms | 12 |
| Quiz | 600ms | 1200ms | 8 |
| Analytics | 700ms | 1800ms | 10 |

## Optimizations applied

- **Lists:** `@shopify/flash-list` on Current Affairs feed and large Result review sections
- **Quiz timer:** isolated in `QuizTimer` so the quiz body does not re-render every second
- **Startup:** critical Plus Jakarta fonts at boot; Space Grotesk stat fonts loaded after splash
- **Navigation:** lazy `getComponent` for admin and rarely used stack screens
- **Images:** `expo-image` via `OptimizedImage` for chat previews and avatars
- **Memoization:** `LineChart`, `QuizOption`, Home sections, Analytics mastery rows

## Checking budgets locally

```bash
cd mobile && npm run test:perf
```

In dev builds, open Home / Quiz / Analytics and watch the Metro console for `[perf]` warnings if a screen exceeds its budget.

## Follow-ups

- Virtualize Ask AI chat and Group Chat with inverted FlashList
- Add Sentry performance transactions for real-device baselines
- Consider Reassure for render regression tests in CI
