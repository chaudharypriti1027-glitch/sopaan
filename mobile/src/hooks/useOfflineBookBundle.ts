import { useEffect, useState } from 'react';
import { getDownloadedBookBundle, type BookBundle } from '../offline/bookDownloadManager';

export function useOfflineBookBundle(bookId: string | undefined) {
  const [bundle, setBundle] = useState<BookBundle | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(bookId));

  useEffect(() => {
    if (!bookId) {
      setBundle(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);

    void getDownloadedBookBundle(bookId).then((local) => {
      if (!mounted) {
        return;
      }
      setBundle(local);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [bookId]);

  return { bundle, isLoading, hasLocalBundle: Boolean(bundle) };
}
