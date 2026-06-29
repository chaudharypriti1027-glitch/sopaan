import type { QueryClient } from '@tanstack/react-query';

/** Query roots that return language-specific content from the API. */
const LANGUAGE_AWARE_ROOTS = new Set([
  'courses',
  'revision-capsules',
  'current-affairs',
  'questions',
  'tests',
  'vocabulary',
  'books',
  'search',
]);

export async function invalidateLanguageQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({
    predicate: (query) => {
      const root = query.queryKey[0];
      return typeof root === 'string' && LANGUAGE_AWARE_ROOTS.has(root);
    },
  });
}
