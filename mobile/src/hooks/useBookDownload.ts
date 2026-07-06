import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { deleteBookDownload, fetchBookDownload } from '../api/books';
import { trackLibraryEvent } from '../analytics/libraryAnalytics';
import {
  isBookDownloadedLocally,
  listDownloadedBooks,
  removeBookBundle,
  saveBookBundle,
} from '../offline/bookDownloadManager';
import { queryKeys } from './queryKeys';

export function useLocalDownloadIds() {
  const [localDownloadIds, setLocalDownloadIds] = useState<ReadonlySet<string>>(new Set());

  const refreshLocalDownloads = useCallback(async () => {
    const records = await listDownloadedBooks();
    setLocalDownloadIds(new Set(records.map((record) => record.bookId)));
  }, []);

  useEffect(() => {
    void refreshLocalDownloads();
  }, [refreshLocalDownloads]);

  return { localDownloadIds, refreshLocalDownloads };
}

export function useBookDownload(options?: { onLocalChange?: () => void }) {
  const { t } = useTranslation(['app', 'common']);
  const queryClient = useQueryClient();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadMutation = useMutation({
    mutationFn: async (bookId: string) => {
      setDownloadingId(bookId);
      const bundle = await fetchBookDownload(bookId);
      await saveBookBundle(bundle);
      return bundle;
    },
    onSettled: () => {
      setDownloadingId(null);
    },
    onSuccess: (_bundle, bookId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      void trackLibraryEvent('download', bookId);
      options?.onLocalChange?.();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bookId: string) => {
      await removeBookBundle(bookId);
      try {
        await deleteBookDownload(bookId);
      } catch {
        // Local file removed even if server row is already gone.
      }
    },
    onSuccess: (_result, bookId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      void trackLibraryEvent('download_delete', bookId);
      options?.onLocalChange?.();
    },
  });

  const downloadBook = useCallback(
    async (bookId: string) => {
      try {
        await downloadMutation.mutateAsync(bookId);
      } catch {
        Alert.alert(t('books.downloadFailed'), t('books.downloadFailedBody'));
      }
    },
    [downloadMutation, t],
  );

  const confirmDeleteDownload = useCallback(
    (bookId: string, title: string) => {
      Alert.alert(t('books.deleteDownload'), t('books.deleteDownloadBody', { title }), [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('books.deleteDownloadAction'),
          style: 'destructive',
          onPress: () => {
            void deleteMutation.mutateAsync(bookId);
          },
        },
      ]);
    },
    [deleteMutation, t],
  );

  const isDownloading = useCallback(
    (bookId: string) => downloadingId === bookId || downloadMutation.isPending,
    [downloadMutation.isPending, downloadingId],
  );

  return {
    downloadBook,
    confirmDeleteDownload,
    isDownloading,
    isBookDownloadedLocally,
  };
}
