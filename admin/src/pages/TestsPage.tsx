import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchPendingTests, reviewTest } from '../api/tests';
import { GenerateExamButton } from '../components/exam/GenerateExamButton';
import { DataTable } from '../components/DataTable';
import { PaginationBar } from '../components/questions/PaginationBar';
import { TableActionButton } from '../components/questions/TableActionButton';
import { useToast } from '../components/Toast';
import type { PendingTest } from '../api/testTypes';
import { truncateText } from '../utils/questionFormat';

const PAGE_SIZE = 20;

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function TestNameCell({ test }: { test: PendingTest }) {
  const label = test.source === 'AI generator' ? 'AI' : initials(test.createdBy?.name ?? 'CM');
  const tone = test.source === 'AI generator' ? 'av-gold' : 'av-navy';

  return (
    <div className="cellname">
      <div className={`av ${tone}`}>{label}</div>
      <div>{truncateText(test.title, 56)}</div>
    </div>
  );
}

export function TestsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'tests', 'pending', offset],
    queryFn: () => fetchPendingTests(PAGE_SIZE, offset),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'tests', 'pending'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      reviewTest(id, action),
    onMutate: ({ id }) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (_data, vars) => {
      showToast(vars.action === 'approve' ? 'Approved & published' : 'Rejected');
      invalidate();
    },
    onError: (err: Error) => showToast(err.message),
  });

  const rows = query.data?.items ?? [];
  const pagination = query.data?.pagination;

  return (
    <div>
      <div className="toolbar">
        <GenerateExamButton label="Generate full exam · AI" />
      </div>

      <DataTable
        rows={rows}
        emptyMessage="No tests pending review"
        isLoading={query.isLoading}
        error={query.isError ? query.error : undefined}
        onRetry={() => void query.refetch()}
        columns={[
          {
            key: 'title',
            header: 'Test',
            render: (row) => <TestNameCell test={row} />,
          },
          { key: 'source', header: 'Source', render: (row) => row.source },
          {
            key: 'questions',
            header: 'Questions',
            render: (row) => row.questionCount.toLocaleString(),
          },
          {
            key: 'status',
            header: 'Status',
            render: () => <span className="pill q-pend">Pending</span>,
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (row) => (
              <div className="act">
                <TableActionButton
                  variant="ok"
                  disabled={busyId === row.id}
                  onClick={() => reviewMutation.mutate({ id: row.id, action: 'approve' })}
                >
                  Approve
                </TableActionButton>
                <TableActionButton
                  variant="danger"
                  disabled={busyId === row.id}
                  onClick={() => reviewMutation.mutate({ id: row.id, action: 'reject' })}
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
