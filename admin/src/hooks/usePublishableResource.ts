import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ContentListParams, PaginatedResponse, PublishStatus } from '../api/contentTypes';
import { useToast } from '../components/Toast';

const PAGE_SIZE = 20;

interface PublishableResourceConfig<
  T extends { id: string; status: PublishStatus },
  TBody = Record<string, unknown>,
> {
  queryKey: readonly unknown[];
  list: (params: ContentListParams) => Promise<PaginatedResponse<T>>;
  create: (body: TBody) => Promise<T>;
  update: (id: string, body: Partial<TBody>) => Promise<T>;
  setStatus: (id: string, status: PublishStatus) => Promise<T>;
  remove: (id: string) => Promise<{ id: string; deleted: boolean }>;
  deleteConfirmLabel: (row: T) => string;
}

export function usePublishableResource<
  T extends { id: string; status: PublishStatus },
  TBody = Record<string, unknown>,
>(
  config: PublishableResourceConfig<T, TBody>,
) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PublishStatus>('all');
  const [offset, setOffset] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: [config.queryKey, { search, statusFilter, offset }],
    queryFn: () =>
      config.list({
        q: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: PAGE_SIZE,
        offset,
      }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [config.queryKey] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PublishStatus }) =>
      config.setStatus(id, status),
    onMutate: ({ id }) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (_data, vars) => {
      showToast(vars.status === 'published' ? 'Published' : 'Unpublished');
      invalidate();
    },
    onError: (err: Error) => showToast(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: config.remove,
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      showToast('Deleted');
      invalidate();
    },
    onError: (err: Error) => showToast(err.message),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, body }: { id?: string; body: TBody }) =>
      id ? config.update(id, body) : config.create(body),
    onSuccess: (_data, vars) => {
      showToast(vars.id ? 'Saved' : 'Created');
      invalidate();
    },
    onError: (err: Error) => showToast(err.message),
  });

  function handleDelete(row: T) {
    if (!window.confirm(`${config.deleteConfirmLabel(row)}\n\nThis cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate(row.id);
  }

  return {
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setOffset(0);
    },
    statusFilter,
    setStatusFilter: (value: typeof statusFilter) => {
      setStatusFilter(value);
      setOffset(0);
    },
    offset,
    setOffset,
    busyId,
    query,
    rows: query.data?.items ?? [],
    pagination: query.data?.pagination,
    statusMutation,
    deleteMutation,
    saveMutation,
    handleDelete,
    pageSize: PAGE_SIZE,
  };
}
