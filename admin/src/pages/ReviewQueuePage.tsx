import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  fetchReviewQueue,
  mergeQuestion,
  recheckQuestion,
  rejectQuestion,
} from '../api/questions';
import { DataTable } from '../components/DataTable';
import { PaginationBar } from '../components/questions/PaginationBar';
import { ReviewIssuePill } from '../components/questions/QuestionStatusPill';
import { TableActionButton } from '../components/questions/TableActionButton';
import { useToast } from '../components/Toast';
import { formatQuestionRef, truncateText } from '../utils/questionFormat';

const PAGE_SIZE = 20;

export function ReviewQueuePage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'review-queue', { search, offset }],
    queryFn: () =>
      fetchReviewQueue({
        q: search.trim() || undefined,
        limit: PAGE_SIZE,
        offset,
      }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const recheckMutation = useMutation({
    mutationFn: recheckQuestion,
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (data) => {
      if (data.reviewStatus === 'approved') {
        showToast('Re-checked — approved');
      } else {
        const issue = data.qualityIssues[0]?.message ?? 'Still has quality issues';
        showToast(`Re-checked — ${issue}`);
      }
      invalidate();
    },
    onError: (err: Error) => showToast(err.message),
  });

  const mergeMutation = useMutation({
    mutationFn: ({ id, into }: { id: string; into: string }) => mergeQuestion(id, into),
    onMutate: ({ id }) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (data) => {
      const ref = data.duplicateOf?.id ? formatQuestionRef(data.duplicateOf.id) : 'canonical';
      showToast(`Merged into ${ref}`);
      invalidate();
    },
    onError: (err: Error) => showToast(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectQuestion,
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      showToast('Rejected');
      invalidate();
    },
    onError: (err: Error) => showToast(err.message),
  });

  const rows = query.data?.items ?? [];
  const pagination = query.data?.pagination;

  return (
    <div>
      <p className="empty-note">
        Questions flagged for quality issues or duplicates. Re-check, merge into the canonical
        question, or reject.
      </p>

      <div className="toolbar">
        <div className="search toolbar-search">
          <svg className="svg" viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            placeholder="Search review queue…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
          />
        </div>
      </div>

      <DataTable
        rows={rows}
        emptyMessage="Review queue is clear"
        isLoading={query.isLoading}
        error={query.isError ? query.error : undefined}
        onRetry={() => void query.refetch()}
        columns={[
          {
            key: 'text',
            header: 'Question',
            render: (row) => truncateText(row.text),
          },
          {
            key: 'issue',
            header: 'Issue',
            render: (row) => {
              const primary = row.qualityIssues.find((i) => i.severity === 'error');
              return <ReviewIssuePill message={primary?.message ?? 'Quality review'} />;
            },
          },
          {
            key: 'duplicate',
            header: 'Duplicate of',
            render: (row) => {
              if (!row.duplicateOf?.id) return '—';
              return formatQuestionRef(row.duplicateOf.id);
            },
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (row) => (
              <div className="act">
                <TableActionButton
                  disabled={busyId === row.id}
                  onClick={() => recheckMutation.mutate(row.id)}
                >
                  Re-check
                </TableActionButton>
                {row.duplicateOf?.id ? (
                  <TableActionButton
                    variant="primary"
                    disabled={busyId === row.id}
                    onClick={() =>
                      mergeMutation.mutate({ id: row.id, into: row.duplicateOf!.id })
                    }
                  >
                    Merge
                  </TableActionButton>
                ) : null}
                <TableActionButton
                  variant="danger"
                  disabled={busyId === row.id}
                  onClick={() => rejectMutation.mutate(row.id)}
                >
                  Reject
                </TableActionButton>
              </div>
            ),
          },
        ]}
      />

      {pagination ? (
        <PaginationBar
          offset={pagination.offset}
          limit={pagination.limit}
          total={pagination.total}
          onPageChange={setOffset}
        />
      ) : null}
    </div>
  );
}
