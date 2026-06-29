import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api';
import { queryKeys } from './queryKeys';

export function useSearch(query: string, enabled = true) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: queryKeys.search.results(trimmed),
    queryFn: () => searchApi.searchAll(trimmed),
    enabled: enabled && trimmed.length > 0,
    staleTime: 30_000,
  });
}
