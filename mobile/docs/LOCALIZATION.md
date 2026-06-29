# Localization

Sopaan Mobile uses [i18next](https://www.i18next.com/) with [react-i18next](https://react.i18next.com/) for UI strings. Numbers, dates, and currency use `useFormat()` (`src/i18n/useFormat.ts`).

## Supported locales

| Code | Language | RTL |
|------|----------|-----|
| `en` | English (India) | No |
| `hi` | Hindi | No |

Configuration lives in `src/i18n/config.ts` (`SUPPORTED_LOCALES`, `RTL_LOCALES`, `LOCALE_INTL`).

## Namespaces

| Namespace | Purpose |
|-----------|---------|
| `common` | Shared actions, errors, offline states |
| `navigation` | Screen titles, tab labels |
| `auth` | Splash, login, signup, onboarding setup |
| `tabs` | Tab-specific copy (reserved) |
| `settings` | Settings screen |
| `app` | Home, practice, quiz, profile, rewards, etc. |
| `release` | OTA / force-update gate |

Files: `src/i18n/locales/<locale>/<namespace>.json`

## Using translations in components

```tsx
import { useTranslation } from 'react-i18next';

function MyScreen() {
  const { t } = useTranslation('app'); // default namespace for this screen
  return <Text>{t('home.greetingMorning')}</Text>;
}
```

Multiple namespaces:

```tsx
const { t } = useTranslation(['app', 'common']);
t('app:home.title');
t('common:cancel');
```

Formatting:

```tsx
import { useFormat } from '../i18n/useFormat';

const { formatNumber, formatDate, formatPercent } = useFormat();
formatDate(publishedAt, { day: 'numeric', month: 'short' });
```

## Adding a new language

Example: adding **Marathi (`mr`)**.

### 1. Create locale files

```text
src/i18n/locales/mr/
  auth.json
  app.json
  common.json
  navigation.json
  release.json
  settings.json
  tabs.json
  index.ts
```

Copy structure from `locales/en/` and translate every key. `index.ts` should mirror `locales/en/index.ts`:

```ts
import auth from './auth.json';
import app from './app.json';
// … other namespaces

export const mrResources = {
  auth,
  app,
  common,
  navigation,
  release,
  settings,
  tabs,
};
```

### 2. Register resources

In `src/i18n/index.ts`:

```ts
import { mrResources } from './locales/mr';

resources: {
  en: enResources,
  hi: hiResources,
  mr: mrResources,
},
```

### 3. Update config

In `src/i18n/config.ts`:

```ts
export const SUPPORTED_LOCALES = ['en', 'hi', 'mr'] as const;

export const LOCALE_INTL: Record<AppLocale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
};
```

If the locale is RTL (e.g. Arabic), add it to `RTL_LOCALES`:

```ts
export const RTL_LOCALES: readonly AppLocale[] = ['ar'];
```

The app’s language picker and `LanguageContext` read from `SUPPORTED_LOCALES`; add a display label in `src/language/types.ts` if you expose the locale in Settings.

### 4. Verify

- Switch language in **Settings → App language**
- Run tests: `npm test` (Jest loads i18n via `jest.setup.ts`)
- Scan for hardcoded strings in new screens

## Tests

`jest.setup.ts` imports `./src/i18n` so `useTranslation()` resolves real keys in component tests. Tests should query translated strings for the default locale (`en`) unless a test overrides language.

## Conventions

- Keep **API / filter values** in English when the backend expects them (e.g. Current Affairs category filters); only translate UI labels.
- Use `common` for reusable buttons (`cancel`, `submit`, `continue`).
- Prefer nested keys (`auth.login.title`) matching existing JSON structure.
- Use i18next plural keys (`_one` / `_other`) for counts, e.g. `cardsReady_one`, `cardsReady_other`.
