// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['node_modules/**', '.expo/**', '**/._*'],
  },
  {
    files: ['**/__tests__/**/*', '**/*.{test,spec}.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/navigation/**/*', 'src/notifications/notificationDeepLinks.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/i18n/index.ts'],
    rules: {
      'import/no-named-as-default-member': 'off',
    },
  },
]);
