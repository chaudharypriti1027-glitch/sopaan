import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Activity,
  Ban,
  Download,
  Eye,
  Gift,
  GraduationCap,
  History,
  ReceiptIndianRupee,
  Search,
  UserRound,
  WalletCards,
} from 'lucide-react';
import {
  downloadStudentsCsv,
  fetchStudent,
  fetchStudents,
  grantStudentPremium,
  revokeStudentPremium,
  setStudentStatus,
  type AdminStudent,
  type AdminStudentDetail,
  type GrantPremiumPlan,
  type StudentAccountStatus,
  type StudentPremiumFilter,
} from '../api/students';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { Drawer } from '../components/content/Drawer';
import { PaginationBar } from '../components/questions/PaginationBar';
import { QueryErrorBanner } from '../components/QueryErrorBanner';
import { TableActionButton } from '../components/questions/TableActionButton';
import { useToast } from '../components/Toast';

const PAGE_SIZE = 20;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatAccuracy(value: number | null) {
  return value != null ? `${value}%` : '—';
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatMoney(paise: number, currency = 'INR') {
  const amount = paise / 100;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

function formatPlanLabel(plan: string | null | undefined) {
  if (!plan) return '—';
  if (plan === 'trial') return 'Trial';
  if (plan === 'monthly') return 'Monthly';
  if (plan === 'yearly') return 'Yearly';
  return plan;
}

function TierPill({
  tier,
  isPremium,
  plan,
}: {
  tier: string;
  isPremium: boolean;
  plan?: string | null;
}) {
  if (isPremium && plan === 'trial') {
    return <span className="pill q-draft">Trial</span>;
  }
  if (isPremium) {
    return <span className="pill q-pub">Pro</span>;
  }
  return <span className="pill q-draft">{tier}</span>;
}

function StatusPill({ status }: { status: AdminStudent['accountStatus'] | null | undefined }) {
  if (status === 'suspended') {
    return <span className="pill q-rev">Suspended</span>;
  }
  return <span className="pill q-pub">Active</span>;
}

export function StudentsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [premiumFilter, setPremiumFilter] = useState<'all' | StudentPremiumFilter>('all');
  const [examFilter, setExamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StudentAccountStatus>('all');
  const [offset, setOffset] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const listParams = {
    q: search.trim() || undefined,
    premium: premiumFilter === 'all' ? undefined : premiumFilter,
    exam: examFilter.trim() || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: PAGE_SIZE,
    offset,
  };

  const query = useQuery({
    queryKey: ['admin', 'students', listParams],
    queryFn: () => fetchStudents(listParams),
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'students', 'detail', selectedId],
    queryFn: () => fetchStudent(selectedId!),
    enabled: Boolean(selectedId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) =>
      setStudentStatus(id, status),
    onMutate: ({ id }) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (data) => {
      showToast(data.accountStatus === 'suspended' ? 'Student suspended' : 'Student reactivated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      if (selectedId && (selectedId === data.id || !data.id)) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'students', 'detail', selectedId] });
      }
    },
    onError: (err: Error) => showToast(err.message || 'Status update failed'),
  });

  const rows = query.data?.items ?? [];
  const pagination = query.data?.pagination;

  async function handleExport() {
    setExporting(true);
    try {
      await downloadStudentsCsv({
        q: listParams.q,
        premium: listParams.premium,
        exam: listParams.exam,
        status: listParams.status,
      });
      showToast('CSV downloaded');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  function handleSuspend(row: AdminStudent) {
    if (!row.id) {
      showToast('Student id missing');
      return;
    }
    const next = row.accountStatus === 'suspended' ? 'active' : 'suspended';
    const verb = next === 'suspended' ? 'Suspend' : 'Unsuspend';
    if (
      !window.confirm(
        `${verb} ${row.name || 'this student'}?${next === 'suspended' ? ' They will be logged out and unable to sign in.' : ''}`
      )
    ) {
      return;
    }
    statusMutation.mutate({ id: row.id, status: next });
  }

  function resetOffset() {
    setOffset(0);
  }

  return (
    <div>
      <div className="toolbar">
        <div className="search toolbar-search">
          <Search aria-hidden strokeWidth={1.8} />
          <input
            placeholder="Search name, phone, email…"
            aria-label="Search students"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetOffset();
            }}
          />
        </div>
        <select
          className="filter-select"
          value={premiumFilter}
          onChange={(e) => {
            setPremiumFilter(e.target.value as typeof premiumFilter);
            resetOffset();
          }}
          aria-label="Filter by premium status"
        >
          <option value="all">All plans</option>
          <option value="pro">Pro (paid)</option>
          <option value="trial">Trial</option>
          <option value="free">Free</option>
        </select>
        <input
          className="filter-select"
          style={{ minWidth: 120 }}
          placeholder="Exam tag…"
          value={examFilter}
          onChange={(e) => {
            setExamFilter(e.target.value);
            resetOffset();
          }}
          aria-label="Filter by exam"
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            resetOffset();
          }}
          aria-label="Filter by account status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <ActionButton variant="ghost" onClick={() => void handleExport()} disabled={exporting}>
          <Download aria-hidden strokeWidth={1.8} />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </ActionButton>
      </div>

      <DataTable
        rows={rows}
        emptyMessage="No students found"
        emptyHint="Try clearing filters or searching by name, phone, or email."
        isLoading={query.isLoading}
        error={query.isError ? query.error : undefined}
        onRetry={() => void query.refetch()}
        columns={[
          {
            key: 'name',
            header: 'Student',
            render: (row) => (
              <div className="cellname">
                <div className="av av-gold">{initials(row.name)}</div>
                <div>
                  <div>{row.name}</div>
                  <div className="sub">{row.email || row.phone || '—'}</div>
                </div>
              </div>
            ),
          },
          {
            key: 'exam',
            header: 'Exam',
            render: (row) => row.targetExam ?? '—',
          },
          {
            key: 'attempts',
            header: 'Attempts',
            render: (row) => row.attempts,
          },
          {
            key: 'accuracy',
            header: 'Accuracy',
            render: (row) => formatAccuracy(row.accuracy),
          },
          {
            key: 'streak',
            header: 'Streak',
            render: (row) => row.streak,
          },
          {
            key: 'tier',
            header: 'Plan',
            render: (row) => (
              <TierPill
                tier={row.tier || 'Free'}
                isPremium={Boolean(row.isPremium)}
                plan={row.premiumPlan}
              />
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <StatusPill status={row.accountStatus} />,
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (row) => (
              <div className="act">
                <TableActionButton
                  onClick={() => {
                    if (row.id) setSelectedId(row.id);
                  }}
                >
                  <Eye aria-hidden strokeWidth={1.8} />
                  View
                </TableActionButton>
                <TableActionButton
                  variant={row.accountStatus === 'suspended' ? 'ok' : 'danger'}
                  disabled={!row.id || busyId === row.id}
                  onClick={() => handleSuspend(row)}
                >
                  <Ban aria-hidden strokeWidth={1.8} />
                  {row.accountStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
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

      <StudentProfileDrawer
        open={Boolean(selectedId)}
        studentId={selectedId}
        student={detailQuery.data ?? null}
        loading={detailQuery.isLoading}
        error={detailQuery.isError ? detailQuery.error : undefined}
        onRetry={() => void detailQuery.refetch()}
        onClose={() => setSelectedId(null)}
        onSuspend={(student) => handleSuspend(student)}
        busy={busyId === selectedId}
        onPremiumChanged={() => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
          if (selectedId) {
            queryClient.invalidateQueries({ queryKey: ['admin', 'students', 'detail', selectedId] });
          }
        }}
      />
    </div>
  );
}

function StudentProfileDrawer({
  open,
  studentId,
  student,
  loading,
  error,
  onRetry,
  onClose,
  onSuspend,
  busy,
  onPremiumChanged,
}: {
  open: boolean;
  studentId: string | null;
  student: AdminStudentDetail | null;
  loading: boolean;
  error?: unknown;
  onRetry: () => void;
  onClose: () => void;
  onSuspend: (student: AdminStudent) => void;
  busy: boolean;
  onPremiumChanged: () => void;
}) {
  const { showToast } = useToast();
  const [grantPlan, setGrantPlan] = useState<GrantPremiumPlan>('monthly');
  const [grantDays, setGrantDays] = useState('');

  const grantMutation = useMutation({
    mutationFn: ({
      id,
      plan,
      days,
    }: {
      id: string;
      plan: GrantPremiumPlan;
      days?: number;
    }) => grantStudentPremium(id, { plan, days }),
    onSuccess: (data) => {
      showToast(
        `Gift sent · Free ${formatPlanLabel(data.premium?.plan)} Pro — student will see a Sopaan celebration popup to share`,
      );
      setGrantDays('');
      onPremiumChanged();
    },
    onError: (err: Error) => showToast(err.message || 'Could not grant Pro'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeStudentPremium(id),
    onSuccess: () => {
      showToast('Pro access ended');
      onPremiumChanged();
    },
    onError: (err: Error) => showToast(err.message || 'Could not revoke Pro'),
  });

  if (!open) return null;

  return (
    <Drawer
      open={open}
      title={student?.name ?? 'Student profile'}
      onClose={onClose}
      footerExtra={
        student ? (
          <ActionButton
            variant={student.accountStatus === 'suspended' ? 'gold' : 'navy'}
            disabled={busy}
            onClick={() => onSuspend(student)}
          >
            <Ban aria-hidden strokeWidth={1.8} />
            {student.accountStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
          </ActionButton>
        ) : null
      }
    >
      {loading ? (
        <p className="empty-note">Loading profile…</p>
      ) : error ? (
        <QueryErrorBanner error={error} onRetry={onRetry} />
      ) : !student ? (
        <p className="empty-note">Student not found.</p>
      ) : (
        <div className="student-profile">
          <section className="drawer-section">
            <SectionTitle icon={UserRound}>Profile</SectionTitle>
            <div className="detail-grid">
              <DetailItem label="Email" value={student.email ?? '—'} />
              <DetailItem label="Phone" value={student.phone ?? '—'} />
              <DetailItem label="Joined" value={formatDate(student.joinedAt)} />
              <DetailItem label="Last active" value={formatDate(student.lastActiveAt)} />
              <DetailItem label="Status" value={student.accountStatus} />
              <DetailItem
                label="Onboarding"
                value={student.onboardingComplete ? 'Complete' : 'Incomplete'}
              />
              <DetailItem label="Language" value={student.language ?? '—'} />
              <DetailItem label="Education" value={student.educationLevel ?? '—'} />
              <DetailItem label="State" value={student.state ?? '—'} />
              <DetailItem label="Category" value={student.category ?? '—'} />
            </div>
          </section>

          <section className="drawer-section">
            <SectionTitle icon={GraduationCap}>Exam goals</SectionTitle>
            <div className="detail-grid">
              <DetailItem label="Preferred exam" value={student.targetExam ?? '—'} />
              <DetailItem label="Exam date" value={formatDate(student.examDate)} />
            </div>
            {(student.goals ?? []).length === 0 ? (
              <p className="empty-note">No saved goals.</p>
            ) : (
              <div className="table-wrap">
                <table className="tbl compact">
                  <thead>
                    <tr>
                      <th>Exam</th>
                      <th>Date</th>
                      <th>Target rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(student.goals ?? []).map((goal, index) => (
                      <tr key={goal.id || `goal-${index}`}>
                        <td>{goal.examName || '—'}</td>
                        <td>{formatDate(goal.examDate)}</td>
                        <td>{goal.targetRank ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="drawer-section">
            <SectionTitle icon={WalletCards}>Subscription</SectionTitle>
            <div className="detail-grid">
              <DetailItem
                label="Access"
                value={
                  student.premium?.isPremium
                    ? student.premium.source === 'trial'
                      ? 'Trial Pro'
                      : student.premium.source === 'admin'
                        ? 'Admin Pro (free)'
                        : 'Pro'
                    : 'Free'
                }
              />
              <DetailItem label="Plan" value={formatPlanLabel(student.premium?.plan)} />
              <DetailItem label="Expires" value={formatDate(student.premium?.expiresAt)} />
              <DetailItem label="Trial used" value={student.premium?.trialUsed ? 'Yes' : 'No'} />
              <DetailItem label="Status" value={student.premium?.status ?? '—'} />
              <DetailItem
                label="Cancelled"
                value={
                  student.premium?.cancelled
                    ? student.premium.cancelAtPeriodEnd
                      ? 'At period end'
                      : 'Yes'
                    : 'No'
                }
              />
              {student.entitlement ? (
                <>
                  <DetailItem
                    label="Period start"
                    value={formatDate(student.entitlement.currentPeriodStart)}
                  />
                  <DetailItem
                    label="Period end"
                    value={formatDate(student.entitlement.currentPeriodEnd)}
                  />
                  <DetailItem
                    label="Provider"
                    value={
                      student.entitlement.provider === 'admin'
                        ? 'Admin (free)'
                        : student.entitlement.provider ?? '—'
                    }
                  />
                </>
              ) : null}
            </div>

            <div className="student-premium-actions">
              <p className="empty-note" style={{ marginBottom: 10 }}>
                Grant complimentary Sopaan Pro — no payment required.
              </p>
              <div className="toolbar" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                <select
                  className="filter-select"
                  value={grantPlan}
                  onChange={(e) => setGrantPlan(e.target.value as GrantPremiumPlan)}
                  aria-label="Grant plan"
                >
                  <option value="monthly">Monthly (1 month)</option>
                  <option value="yearly">Yearly (1 year)</option>
                  <option value="trial">Trial (1 month)</option>
                </select>
                <input
                  className="filter-select"
                  style={{ minWidth: 110, maxWidth: 140 }}
                  type="number"
                  min={1}
                  max={3650}
                  placeholder="Custom days"
                  value={grantDays}
                  onChange={(e) => setGrantDays(e.target.value)}
                  aria-label="Custom days (optional)"
                />
                <ActionButton
                  variant="gold"
                  disabled={grantMutation.isPending || !studentId}
                  onClick={() => {
                    if (!studentId) return;
                    const days = grantDays.trim() ? Number(grantDays) : undefined;
                    if (days != null && (!Number.isFinite(days) || days < 1)) {
                      showToast('Enter a valid number of days');
                      return;
                    }
                    const label =
                      days != null
                        ? `${days} day(s) of ${formatPlanLabel(grantPlan)}`
                        : formatPlanLabel(grantPlan);
                    if (
                      !window.confirm(
                        `Send a Sopaan Pro gift (${label}) to ${student.name || 'this student'}?\n\nThey’ll get a celebration popup to share on Instagram and more.`,
                      )
                    ) {
                      return;
                    }
                    grantMutation.mutate({ id: studentId, plan: grantPlan, days });
                  }}
                >
                  <Gift aria-hidden strokeWidth={1.8} size={16} />
                  {grantMutation.isPending ? 'Granting…' : 'Grant free Pro'}
                </ActionButton>
              </div>
              {student.premium?.isPremium ? (
                <ActionButton
                  variant="red"
                  disabled={revokeMutation.isPending || !studentId}
                  onClick={() => {
                    if (!studentId) return;
                    if (
                      !window.confirm(
                        `End Pro access for ${student.name || 'this student'} now?`,
                      )
                    ) {
                      return;
                    }
                    revokeMutation.mutate(studentId);
                  }}
                >
                  <Ban aria-hidden strokeWidth={1.8} size={16} />
                  {revokeMutation.isPending ? 'Ending…' : 'End Pro access'}
                </ActionButton>
              ) : null}
            </div>
          </section>

          {(student.payments ?? []).length > 0 ? (
            <section className="drawer-section">
              <SectionTitle icon={ReceiptIndianRupee}>Recent payments</SectionTitle>
              <div className="table-wrap">
                <table className="tbl compact">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(student.payments ?? []).map((payment, index) => (
                      <tr key={payment.id || `payment-${index}`}>
                        <td>{formatPlanLabel(payment.plan)}</td>
                        <td>{formatMoney(payment.amountPaise ?? 0, payment.currency)}</td>
                        <td>{payment.status || '—'}</td>
                        <td>{formatDate(payment.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="drawer-section">
            <SectionTitle icon={Activity}>Activity</SectionTitle>
            <div className="detail-grid">
              <DetailItem label="Attempts" value={String(student.attempts ?? 0)} />
              <DetailItem label="Accuracy" value={formatAccuracy(student.accuracy)} />
              <DetailItem label="Streak" value={String(student.streak ?? 0)} />
              <DetailItem label="Last attempt" value={formatDate(student.lastAttemptAt)} />
              <DetailItem label="Coins" value={String(student.coins ?? 0)} />
              <DetailItem label="Level / XP" value={`${student.level ?? 0} / ${student.xp ?? 0}`} />
            </div>
          </section>

          <section className="drawer-section">
            <SectionTitle icon={History}>Attempt history</SectionTitle>
            {(student.attemptHistory ?? []).length === 0 ? (
              <p className="empty-note">No attempts yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="tbl compact">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Score</th>
                      <th>Accuracy</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(student.attemptHistory ?? []).map((attempt, index) => (
                      <tr key={attempt.id || `attempt-${index}`}>
                        <td>
                          <div>{attempt.testTitle || '—'}</div>
                          <div className="sub">
                            {[attempt.examTag, attempt.testType].filter(Boolean).join(' · ') || '—'}
                          </div>
                        </td>
                        <td>{attempt.score ?? '—'}</td>
                        <td>{formatAccuracy(attempt.accuracy)}</td>
                        <td>{formatDate(attempt.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof UserRound; children: string }) {
  return (
    <h3 className="sec-t section-title-icon">
      <Icon aria-hidden strokeWidth={1.8} />
      {children}
    </h3>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || '—'}</span>
    </div>
  );
}
