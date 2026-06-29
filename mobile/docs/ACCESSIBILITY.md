# Accessibility

Sopaan Mobile targets **WCAG 2.1 AA** patterns on Android TalkBack and iOS VoiceOver, aligned with the design token system.

## Design tokens

| Token | Location | Value |
|-------|----------|-------|
| `theme.a11y.minTouchTarget` | `src/theme/tokens.ts` | **44px** minimum interactive size |
| Tab inactive color | `lightTheme.ts` | `slate500` (~4.5:1 on white) |
| Tab label size | `buildTypography.ts` | **12px** minimum (`tabLabel`, `fabLabel`) |

Use `theme.a11y.minTouchTarget` for custom `Pressable` / icon controls instead of hard-coded sizes.

## Dynamic type

- `allowFontScaling: true` on user-facing text via `scalableTextProps` / `denseTextProps` (`src/a11y/textProps.ts`).
- `maxFontSizeMultiplier`: **1.5** (body), **1.35** (tabs/chips).
- Do not set `allowFontScaling={false}` on readable content.

## Component patterns

### Buttons & icons

```tsx
<Button label={t('common:save')} />  // role + label built-in
<IconButton accessibilityLabel={t('app:home.searchA11y')} icon={...} />
<BackButton onPress={goBack} />
```

`IconButton` defaults to **44×44** with hit-slop expansion for smaller visual sizes.

### Charts & rings

Decorative SVG is hidden from screen readers; a spoken summary is provided:

| Component | Role | Summary |
|-----------|------|---------|
| `ProgressBar` | `progressbar` | `"Progress, 72 percent"` |
| `RankRing` | `progressbar` | `"Score, 72 of 100"` |
| `LineChart` / `BarChart` | `image` | Point list via `summarizeChartPoints()` |
| `TimerRing` | `timer` | `"Time remaining, 4:32"` + live region |

Pass `accessibilityLabel` to override auto-generated summaries.

### Tabs & lists

- `TabBar`: `accessibilityRole="tab"` + localized label per item.
- `SegTabs`: explicit `accessibilityLabel` from option label.
- `SettingsRow`, profile quick links: `accessibilityLabel={label}`.

### i18n

Accessibility strings use the `*A11y` suffix in locale JSON (`app.json`, `common.json`). Add **both** `en` and `hi` when introducing new controls.

## Manual testing (TalkBack / Android)

1. Enable **Settings → Accessibility → TalkBack**.
2. Verify tab order: top → content → bottom tab bar → FAB.
3. Core flows to smoke-test:
   - **Home** — readiness card, continue cards, header search/notifications
   - **Ask AI** — back, camera/gallery/send, suggested prompts
   - **Quiz** — options, mark-for-review, palette, submit
   - **Settings** — rows announce label + value
4. Charts should read a numeric summary, not silent SVG.
5. All tappable targets should be easy to activate (≥ 44px).

### ADB helpers (optional)

```bash
adb shell uiautomator dump /sdcard/a11y.xml && adb pull /sdcard/a11y.xml
adb shell settings get secure enabled_accessibility_services
```

## Checklist for new screens

- [ ] Every `Pressable` has `accessibilityRole` + `accessibilityLabel`
- [ ] Icon-only controls use `IconButton` or explicit labels
- [ ] Charts/rings use shared components with summaries
- [ ] Touch targets ≥ `theme.a11y.minTouchTarget`
- [ ] Text uses `scalableTextProps` where presets are applied manually
- [ ] New strings added to `en` + `hi` locale files
