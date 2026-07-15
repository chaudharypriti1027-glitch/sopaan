#!/usr/bin/env node
/**
 * Flags likely hardcoded user-facing strings in prioritized mobile screens.
 * Strings passed through t() / i18n.t() on the same line are ignored.
 * Suppress a line with: // i18n-ok
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES_ROOT = path.join(ROOT, 'src/i18n/locales');
const LOCALES = ['en', 'hi', 'gu'];
const PARITY_SCOPES = {
  app: ['answerEvaluation.', 'manageSubscription.'],
  auth: ['forgot.', 'changePassword.'],
  common: [''],
  navigation: [''],
  settings: [
    'termsOfService',
    'termsOfServiceDesc',
    'changePassword',
    'changePasswordDesc',
  ],
};

/** High-traffic screens and their supporting UI — expand as coverage grows. */
const PRIORITY_FILES = [
  'src/screens/HomeScreen.tsx',
  'src/screens/tabs/PracticeScreen.tsx',
  'src/screens/tabs/CurrentAffairsScreen.tsx',
  'src/screens/ProfileScreen.tsx',
  'src/screens/LoginScreen.tsx',
  'src/screens/SignupScreen.tsx',
  'src/screens/OtpScreen.tsx',
  'src/screens/ProfileSetupScreen.tsx',
  'src/screens/auth/OnboardingScreen.tsx',
  'src/screens/auth/GoalSetupScreen.tsx',
  'src/screens/auth/ProfileSetupScreen.tsx',
  'src/screens/auth/OtpLoginScreen.tsx',
  'src/screens/auth/AuthScreenLayout.tsx',
  'src/screens/app/QuizScreen.tsx',
  'src/screens/app/ResultScreen.tsx',
  'src/screens/app/ForumScreen.tsx',
  'src/screens/app/FriendsScreen.tsx',
  'src/screens/app/MessagesScreen.tsx',
  'src/components/home/HomeHeroScroll.tsx',
  'src/components/home/DailyChallengeCard.tsx',
  'src/components/home/HomeOfflineBanner.tsx',
  'src/components/home/AffairsList.tsx',
  'src/components/home/LeagueSnapshot.tsx',
  'src/components/home/RecommendedRow.tsx',
  'src/components/home/QuickActionsGrid.tsx',
  'src/components/home/HomeFeedContent.tsx',
  'src/components/profile/profileMenu.ts',
  'src/components/profile/ProfileHeader.tsx',
  'src/components/profile/ProfileStatsCard.tsx',
  'src/components/profile/ProfileCompletionCard.tsx',
  'src/components/profile/ProfileEditSheet.tsx',
  'src/components/profile/ProfileAccountDetails.tsx',
  'src/components/profile/ProfileProCard.tsx',
  'src/components/profile/ProfileMenuSectionCard.tsx',
  'src/components/profile/ProfileSectionLabel.tsx',
];

const USER_FACING_PROPS = [
  'label',
  'title',
  'subtitle',
  'placeholder',
  'accessibilityLabel',
  'message',
  'headerTitle',
  'eyebrow',
  'badge',
  'hint',
  'meta',
];

const ALLOWED_EXACT = new Set([
  '—',
  '·',
  '●',
  '→',
  '✓',
  'or',
  'en',
  'hi',
  'gu',
  'email',
  'phone',
  'indigo',
  'gold',
  'teal',
  'coral',
  'primary',
  'secondary',
  'destructive',
  'cancel',
  'library',
  'handled',
  'spinner',
  'default',
  'pageSheet',
  'slide',
  'button',
  'selected',
  'General',
  'Rookie',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'XP',
  'AIR',
  'GEN',
  'OBC',
  'SC',
  'ST',
  'EWS',
  '₹100',
  'Kuldip Chaudhary',
  'kuldip@gmail.com',
]);

function hasTranslationCall(line) {
  return /\bt\s*\(|i18n\.t\s*\(|Trans\s/i.test(line);
}

function isCodeContext(line) {
  return (
    /Record<|Promise<|navigation\.|getParent|typeof |as const|testID|accessibilityState|variant=|style=|import |export |interface |type /.test(
      line,
    )
  );
}

function isAllowedString(value) {
  const text = value.trim();
  if (!text || text.length < 2) {
    return true;
  }
  if (ALLOWED_EXACT.has(text)) {
    return true;
  }
  if (/^[\d\s#%+\-—·.,:;!?/\\|@&*()[\]{}'"`~^]+$/.test(text)) {
    return true;
  }
  if (/^#[0-9A-Fa-f]{3,8}$/.test(text)) {
    return true;
  }
  if (/^https?:\/\//i.test(text)) {
    return true;
  }
  if (/^rgba?\(/i.test(text)) {
    return true;
  }
  if (/^[a-z][a-z0-9-]*$/.test(text) && !text.includes(' ')) {
    return true;
  }
  if (/^[A-Z][a-zA-Z0-9]+$/.test(text) && text.length >= 8) {
    return true;
  }
  if (/^[\p{Emoji}\s]+$/u.test(text)) {
    return true;
  }
  if (/^\d+(\.\d+)?$/.test(text)) {
    return true;
  }
  return false;
}

function looksLikeUserFacing(text) {
  if (isAllowedString(text)) {
    return false;
  }
  if (!/[a-zA-Z]{2,}/.test(text)) {
    return false;
  }
  if (/^[a-z]+(-[a-z]+)+$/.test(text)) {
    return false;
  }
  return true;
}

function collectFromLine(line, lineNum, filePath, violations) {
  if (line.trim().startsWith('//') || line.includes('i18n-ok')) {
    return;
  }
  if (hasTranslationCall(line) || isCodeContext(line)) {
    return;
  }

  for (const match of line.matchAll(/>([A-Za-z][^<>{}\n]*[a-zA-Z][^<>{}\n]*)</g)) {
    const text = match[1].trim();
    if (looksLikeUserFacing(text)) {
      violations.push({ file: filePath, line: lineNum, kind: 'jsx-text', text });
    }
  }

  for (const prop of USER_FACING_PROPS) {
    const re = new RegExp(`${prop}\\s*=\\s*["'\`]([^"'\`]+)["'\`]`, 'g');
    for (const match of line.matchAll(re)) {
      const text = match[1].trim();
      if (looksLikeUserFacing(text)) {
        violations.push({ file: filePath, line: lineNum, kind: prop, text });
      }
    }
  }

  for (const match of line.matchAll(/Alert\.alert\s*\(\s*['"]([^'"]+)['"]/g)) {
    const text = match[1].trim();
    if (looksLikeUserFacing(text)) {
      violations.push({ file: filePath, line: lineNum, kind: 'alert', text });
    }
  }

  for (const match of line.matchAll(/(?:label|title|hint|meta):\s*['"]([^'"]+)['"]/g)) {
    const text = match[1].trim();
    if (looksLikeUserFacing(text)) {
      violations.push({ file: filePath, line: lineNum, kind: 'object-literal', text });
    }
  }

  for (const match of line.matchAll(/set\w+Error\s*\(\s*['"]([^'"]+)['"]/g)) {
    const text = match[1].trim();
    if (looksLikeUserFacing(text)) {
      violations.push({ file: filePath, line: lineNum, kind: 'error', text });
    }
  }
}

function scanFile(relativePath) {
  const absolute = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolute)) {
    return [];
  }

  const violations = [];
  fs.readFileSync(absolute, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      collectFromLine(line, index + 1, relativePath, violations);
    });

  return violations;
}

function collectLeafKeys(value, prefix = '', keys = []) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      collectLeafKeys(child, prefix ? `${prefix}.${key}` : key, keys);
    }
  } else {
    keys.push(prefix);
  }
  return keys;
}

function scanLocaleKeyParity() {
  const violations = [];

  for (const [namespace, scopes] of Object.entries(PARITY_SCOPES)) {
    const keysByLocale = Object.fromEntries(
      LOCALES.map((locale) => {
        const filePath = path.join(LOCALES_ROOT, locale, `${namespace}.json`);
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const keys = collectLeafKeys(parsed).filter((key) =>
          scopes.some((scope) => (scope.endsWith('.') ? key.startsWith(scope) : key === scope || scope === '')),
        );
        return [locale, new Set(keys)];
      }),
    );
    const reference = keysByLocale.en;

    for (const locale of LOCALES.filter((item) => item !== 'en')) {
      for (const key of reference) {
        if (!keysByLocale[locale].has(key)) {
          violations.push(`${locale}/${namespace}.json missing "${key}"`);
        }
      }
      for (const key of keysByLocale[locale]) {
        if (!reference.has(key)) {
          violations.push(`${locale}/${namespace}.json has extra "${key}"`);
        }
      }
    }
  }

  return violations;
}

function main() {
  const all = PRIORITY_FILES.flatMap(scanFile);
  const localeViolations = scanLocaleKeyParity();

  if (all.length === 0 && localeViolations.length === 0) {
    console.log(
      `i18n check passed — no hardcoded strings in ${PRIORITY_FILES.length} priority files and locale keys match.`,
    );
    process.exit(0);
  }

  console.error(`Found ${all.length} likely hardcoded user-facing string(s):\n`);
  for (const v of all) {
    console.error(`  ${v.file}:${v.line} [${v.kind}] "${v.text}"`);
  }
  for (const violation of localeViolations) {
    console.error(`  ${violation}`);
  }
  console.error('\nWrap copy in t() / i18n.t() or add // i18n-ok with justification.');
  process.exit(1);
}

main();
