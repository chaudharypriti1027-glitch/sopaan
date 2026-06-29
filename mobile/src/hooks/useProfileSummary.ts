import { useQuery } from '@tanstack/react-query';
import { getProfileSummary, type ProfileSummary } from '../api/me';
import { listDownloads } from '../offline/downloadManager';
import { listNotes } from '../notes/notesStorage';
import { useAuthStore } from '../store/auth';
import { queryKeys } from './queryKeys';

async function fetchProfileSummary(): Promise<ProfileSummary> {
  const [remote, notes, downloads] = await Promise.all([
    getProfileSummary(),
    listNotes(),
    listDownloads(),
  ]);

  return {
    ...remote,
    savedQuestions: notes.length,
    downloads: downloads.filter((item) => item.status === 'completed').length,
  };
}

/** Live profile menu counts — merges server summary with on-device notes and downloads. */
export function useProfileSummary() {
  const isAuthenticated = useAuthStore((state) => state.status === 'authed');

  return useQuery({
    queryKey: queryKeys.account.summary(),
    queryFn: fetchProfileSummary,
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}
