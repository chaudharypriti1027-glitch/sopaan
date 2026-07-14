import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchRevenueSummary,
  listAdminTransactions,
  refundAdminTransaction,
  remindAdminTransaction,
  type AdminTransaction,
} from '../api/revenue';
import { DataTable } from '../components/DataTable';
import { QueryErrorBanner } from '../components/QueryErrorBanner';
import { useToast } from '../components/Toast';
import './revenue.css';

function formatInr(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

function formatWhen(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function planLabel(plan: AdminTransaction['plan']) {
  return plan === 'yearly' ? 'Pro · Yearly' : 'Pro · Monthly';
}

function statusPill(status: AdminTransaction['status']) {
  switch (status) {
    case 'paid':
      return { label: 'Paid', className: 'p-pub' };
    case 'refunded':
      return { label: 'Refunded', className: 'p-rej' };
    case 'failed':
      return { label: 'Failed', className: 'p-rej' };
    default:
      return { label: 'Pending', className: 'p-draft' };
  }
}

export function RevenuePage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const revenueQuery = useQuery({
    queryKey: ['admin', 'revenue'],
    queryFn: fetchRevenueSummary,
  });

  const transactionsQuery = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: () => listAdminTransactions(50),
  });

  const refundMutation = useMutation({
    mutationFn: (id: string) => refundAdminTransaction(id),
    onSuccess: (result) => {
      showToast(`Refund issued (${result.refundId})`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'revenue'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  const remindMutation = useMutation({
    mutationFn: (id: string) => remindAdminTransaction(id),
    onSuccess: (result) => {
      showToast(`Reminder sent to ${result.studentName}`);
    },
    onError: (err: Error) => showToast(err.message),
  });

  const summary = revenueQuery.data;
  const rows = transactionsQuery.data?.items ?? [];

  return (
    <div className="revenue-page">
      <div className="sec-t" style={{ marginTop: 0 }}>
        Revenue overview
      </div>
      {revenueQuery.isError ? (
        <QueryErrorBanner
          error={revenueQuery.error}
          onRetry={() => void revenueQuery.refetch()}
        />
      ) : null}
      <div className="revenue-metrics">
        <div className="revenue-metric-card">
          <div className="label">MRR</div>
          <div className="value currency">{formatInr(summary?.mrr ?? 0)}</div>
        </div>
        <div className="revenue-metric-card">
          <div className="label">Active subscriptions</div>
          <div className="value">{summary?.activeSubs ?? 0}</div>
        </div>
        <div className="revenue-metric-card">
          <div className="label">ARPU</div>
          <div className="value currency">{formatInr(summary?.arpu ?? 0)}</div>
        </div>
        <div className="revenue-metric-card">
          <div className="label">Refunds (30d)</div>
          <div className="value">{summary?.refunds30d ?? 0}</div>
        </div>
      </div>

      <div className="sec-t">Transactions</div>
      <div className="panel">
        <DataTable<AdminTransaction>
          rows={rows}
          emptyMessage="No payment transactions yet"
          isLoading={transactionsQuery.isLoading}
          error={transactionsQuery.isError ? transactionsQuery.error : undefined}
          onRetry={() => void transactionsQuery.refetch()}
          columns={[
            {
              key: 'student',
              header: 'Student',
              render: (row) => (
                <div>
                  <strong>{row.studentName}</strong>
                  {row.studentEmail ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.studentEmail}</div>
                  ) : null}
                </div>
              ),
            },
            {
              key: 'plan',
              header: 'Plan',
              render: (row) => planLabel(row.plan),
            },
            {
              key: 'amount',
              header: 'Amount',
              render: (row) => {
                if (row.discountPaise > 0) {
                  return (
                    <div>
                      <div>{formatInr(row.amountPaise)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        −{formatInr(row.discountPaise)}
                        {row.couponCode ? ` (${row.couponCode})` : ''}
                      </div>
                    </div>
                  );
                }
                return formatInr(row.amountPaise);
              },
            },
            {
              key: 'payment',
              header: 'Payment',
              render: (row) => (row.paymentId ? row.paymentId.slice(-8) : '—'),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => {
                const pill = statusPill(row.status);
                return <span className={`pill ${pill.className}`}>{pill.label}</span>;
              },
            },
            {
              key: 'created',
              header: 'Created',
              render: (row) => formatWhen(row.createdAt),
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <div className="act">
                  {row.canRefund ? (
                    <button
                      type="button"
                      className="abtn no"
                      disabled={refundMutation.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Refund ${formatInr(row.amountPaise)} to ${row.studentName}? This revokes Pro access.`,
                          )
                        ) {
                          refundMutation.mutate(row.id);
                        }
                      }}
                    >
                      Refund
                    </button>
                  ) : null}
                  {row.canRemind ? (
                    <button
                      type="button"
                      className="abtn pri"
                      disabled={remindMutation.isPending}
                      onClick={() => remindMutation.mutate(row.id)}
                    >
                      Remind
                    </button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
