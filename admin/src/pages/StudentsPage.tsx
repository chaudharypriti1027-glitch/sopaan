import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  downloadStudentsCsv,
  fetchStudent,
  fetchStudents,
  setStudentStatus,
  type AdminStudent,
  type AdminStudentDetail,
} from '../api/students';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { Drawer } from '../components/content/Drawer';
import { PaginationBar } from '../components/questions/PaginationBar';
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

function TierPill({ tier, isPremium }: { tier: string; isPremium: boolean }) {
  if (isPremium) {
    return <span className="pill q-pub">Pro</span>;
  }
  return <span className="pill q-draft">{tier}</span>;
}

function StatusPill({ status }: { status: AdminStudent['accountStatus'] }) {
  if (status === 'suspended') {
    return <span className="pill q-rev">Suspended</span>;
  }
  return <span className="pill q-pub">Active</span>;
}

export function StudentsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'students', { search, offset }],
    queryFn: () =>
      fetchStudents({
        q: search.trim() || undefined,
        limit: PAGE_SIZE,
        offset,
      }),
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
      if (selectedId === data.id) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'students', 'detail', data.id] });
      }
    },
    onError: (err: Error) => showToast(err.message),
  });

  const rows = query.data?.items ?? [];
  const pagination = query.data?.pagination;

  async function handleExport() {
    setExporting(true);
    try {
      await downloadStudentsCsv(search.trim() || undefined);
      showToast('CSV downloaded');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  function handleSuspend(row: AdminStudent) {
    const next = row.accountStatus === 'suspended' ? 'active' : 'suspended';
    const verb = next === 'suspended' ? 'Suspend' : 'Unsuspend';
    if (
      !window.confirm(
        `${verb} ${row.name}?${next === 'suspended' ? ' They will be logged out and unable to sign in.' : ''}`,
      )
    ) {
      return;
    }
    statusMutation.mutate({ id: row.id, status: next });
  }

  return (
    <div>
      <div className="toolbar">
        <div className="search toolbar-search">
          <svg className="svg" viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            placeholder="Search students…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
          />
        </div>
        <ActionButton variant="ghost" onClick={() => void handleExport()} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </ActionButton>
      </div>

      <DataTable
        rows={rows}
        emptyMessage="No students found"
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
            header: 'Tier',
            render: (row) => <TierPill tier={row.tier} isPremium={row.isPremium} />,
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
                <TableActionButton onClick={() => setSelectedId(row.id)}>View</TableActionButton>
                <TableActionButton
                  variant={row.accountStatus === 'suspended' ? 'ok' : 'danger'}
                  disabled={busyId === row.id}
                  onClick={() => handleSuspend(row)}
                >
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
        student={detailQuery.data ?? null}
        loading={detailQuery.isLoading}
        onClose={() => setSelectedId(null)}
        onSuspend={(student) => handleSuspend(student)}
        busy={busyId === selectedId}
      />
    </div>
  );
}

function StudentProfileDrawer({
  open,
  student,
  loading,
  onClose,
  onSuspend,
  busy,
}: {
  open: boolean;
  student: AdminStudentDetail | null;
  loading: boolean;
  onClose: () => void;
  onSuspend: (student: AdminStudent) => void;
  busy: boolean;
}) {
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
            {student.accountStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
          </ActionButton>
        ) : null
      }
    >
      {loading ? (
        <p className="empty-note">Loading profile…</p>
      ) : !student ? (
        <p className="empty-note">Student not found.</p>
      ) : (
        <div className="student-profile">
          <div className="detail-grid">
            <DetailItem label="Email" value={student.email ?? '—'} />
            <DetailItem label="Phone" value={student.phone ?? '—'} />
            <DetailItem label="Target exam" value={student.targetExam ?? '—'} />
            <DetailItem label="Attempts" value={String(student.attempts)} />
            <DetailItem label="Accuracy" value={formatAccuracy(student.accuracy)} />
            <DetailItem label="Streak" value={String(student.streak)} />
            <DetailItem label="Tier" value={student.tier} />
            <DetailItem label="Status" value={student.accountStatus} />
            <DetailItem label="Coins" value={String(student.coins)} />
            <DetailItem label="Level" value={String(student.level)} />
            <DetailItem label="Joined" value={formatDate(student.joinedAt)} />
            <DetailItem label="Last attempt" value={formatDate(student.lastAttemptAt)} />
          </div>

          <h3 className="sec-t">Attempt history</h3>
          {student.attemptHistory.length === 0 ? (
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
                  {student.attemptHistory.map((attempt) => (
                    <tr key={attempt.id}>
                      <td>
                        <div>{attempt.testTitle}</div>
                        {attempt.examTag ? (
                          <div className="sub">{attempt.examTag}</div>
                        ) : null}
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
        </div>
      )}
    </Drawer>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}
