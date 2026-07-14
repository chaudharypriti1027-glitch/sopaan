import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/** Invalidate student-facing caches when admin publishes or updates content. */
export function invalidateStudentContentQueries(queryClient: QueryClient, domain: string) {
  switch (domain) {
    case 'live-classes':
      void queryClient.invalidateQueries({ queryKey: queryKeys.liveClasses.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      break;
    case 'courses':
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      break;
    case 'books':
      void queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      break;
    case 'current-affairs':
      void queryClient.invalidateQueries({ queryKey: queryKeys.currentAffairs.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      break;
    case 'exams':
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      break;
    case 'tests':
      void queryClient.invalidateQueries({ queryKey: queryKeys.tests.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.testSeries.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      break;
    case 'banners':
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.banner() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      break;
    case 'home':
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      break;
    default:
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      break;
  }
}
