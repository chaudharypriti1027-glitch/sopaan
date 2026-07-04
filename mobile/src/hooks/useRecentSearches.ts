import { useCallback, useEffect, useState } from 'react';
import { deleteSecureItem, getSecureItem, setSecureItem } from '../lib/secureStorage';

const RECENT_SEARCHES_KEY = 'sopaan_recent_searches';
const MAX_RECENT = 8;

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await getSecureItem(RECENT_SEARCHES_KEY);
        if (raw) {
          setRecent(JSON.parse(raw) as string[]);
        }
      } catch {
        setRecent([]);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const addRecent = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, MAX_RECENT);
      void setSecureItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecent = useCallback(async () => {
    setRecent([]);
    await deleteSecureItem(RECENT_SEARCHES_KEY);
  }, []);

  return { recent, loaded, addRecent, clearRecent };
}
