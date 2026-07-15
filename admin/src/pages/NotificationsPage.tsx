import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarClock, Send } from 'lucide-react';
import {
  createAdminNotification,
  fetchAdminNotificationAudienceCount,
  listAdminNotifications,
  type AdminNotification,
  type AdminNotificationAudience,
} from '../api/notifications';
import { fetchAdminStats } from '../api/admin';
import { fetchExams } from '../api/exams';
import type { AdminExam } from '../api/contentTypes';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/content/FormField';
import { QueryErrorBanner } from '../components/QueryErrorBanner';
import { useToast } from '../components/Toast';
import './notifications.css';

type SendMode = 'now' | 'schedule';

const AUDIENCE_OPTIONS: { value: AdminNotificationAudience; label: string }[] = [
  { value: 'all', label: 'All students' },
  { value: 'active30d', label: 'Active (30 days)' },
  { value: 'pro', label: 'Pro members' },
  { value: 'free', label: 'Free tier' },
  { value: 'byExam', label: 'By exam' },
];

function formatWhen(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function formatAudience(row: AdminNotification) {
  if (row.audience === 'byExam' && row.exam) {
    return `Exam: ${row.exam}`;
  }
  return AUDIENCE_OPTIONS.find((item) => item.value === row.audience)?.label ?? row.audience;
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function NotificationsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('New mock is live');
  const [body, setBody] = useState(
    'SSC CGL Full Mock just dropped. Take it now and climb the leaderboard.'
  );
  const [audience, setAudience] = useState<AdminNotificationAudience>('all');
  const [exam, setExam] = useState('');
  const [sendMode, setSendMode] = useState<SendMode>('now');
  const [sendAt, setSendAt] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000))
  );

  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
  });

  const examsQuery = useQuery({
    queryKey: ['admin', 'exams', 'notification-picker'],
    queryFn: () => fetchExams({ limit: 100 }),
    enabled: audience === 'byExam',
  });

  const audienceCountQuery = useQuery({
    queryKey: ['admin', 'notifications', 'audience-count', audience, exam],
    queryFn: () =>
      fetchAdminNotificationAudienceCount(audience, audience === 'byExam' ? exam : undefined),
  });

  const recentQuery = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: () => listAdminNotifications(),
  });

  const createMutation = useMutation({
    mutationFn: createAdminNotification,
    onSuccess: (row) => {
      showToast(
        row.status === 'scheduled'
          ? `Scheduled for ${formatWhen(row.sendAt)}`
          : `Sent to ${row.stats.targeted} students`
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  useEffect(() => {
    if (audience !== 'byExam') {
      return;
    }

    const firstExam = examsQuery.data?.items?.[0]?.name;
    if (!exam && firstExam) {
      setExam(firstExam);
    }
  }, [audience, exam, examsQuery.data?.items]);

  const audienceLabel = useMemo(() => {
    const base = AUDIENCE_OPTIONS.find((item) => item.value === audience)?.label ?? audience;
    const count = audienceCountQuery.data?.count;
    if (count == null) {
      return base;
    }
    return `${base} (${count.toLocaleString()})`;
  }, [audience, audienceCountQuery.data?.count]);

  function handleSend() {
    if (!title.trim() || !body.trim()) {
      showToast('Title and message are required');
      return;
    }

    if (audience === 'byExam' && !exam.trim()) {
      showToast('Select an exam for this audience');
      return;
    }

    let scheduledAt: string | undefined;
    if (sendMode === 'schedule') {
      const date = new Date(sendAt);
      if (!sendAt || Number.isNaN(date.getTime())) {
        showToast('Choose a valid send time');
        return;
      }
      if (date.getTime() <= Date.now()) {
        showToast('Scheduled time must be in the future');
        return;
      }
      scheduledAt = date.toISOString();
    }

    createMutation.mutate({
      title: title.trim(),
      body: body.trim(),
      audience,
      exam: audience === 'byExam' ? exam.trim() : undefined,
      sendAt: scheduledAt,
    });
  }

  return (
    <div className="notifications-page">
      <div className="notifications-grid">
        <div className="panel">
          <div className="ph">
            <h3 className="panel-title-icon">
              <BellRing aria-hidden strokeWidth={1.8} />
              Compose notification
            </h3>
          </div>
          <div className="drawer-form" style={{ padding: '0 16px 16px' }}>
            <FormField id="notif-title" label="Title">
              <input
                id="notif-title"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </FormField>
            <FormField id="notif-body" label="Message">
              <textarea
                id="notif-body"
                className="form-input form-textarea"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
              />
            </FormField>
            <FormField id="notif-audience" label="Audience">
              <select
                id="notif-audience"
                className="form-input"
                value={audience}
                onChange={(e) => setAudience(e.target.value as AdminNotificationAudience)}
              >
                {AUDIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                    {option.value === 'all' && statsQuery.data
                      ? ` (${statsQuery.data.totalStudents ?? 0})`
                      : ''}
                    {option.value === 'active30d' && statsQuery.data
                      ? ` (${statsQuery.data.activeStudents ?? 0})`
                      : ''}
                    {option.value === 'pro' && audienceCountQuery.data?.count != null
                      ? ` (${audienceCountQuery.data.count})`
                      : ''}
                  </option>
                ))}
              </select>
            </FormField>
            {audience === 'byExam' ? (
              <FormField id="notif-exam" label="Exam">
                {examsQuery.isError ? (
                  <QueryErrorBanner
                    error={examsQuery.error}
                    onRetry={() => void examsQuery.refetch()}
                  />
                ) : null}
                <select
                  id="notif-exam"
                  className="form-input"
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  disabled={examsQuery.isLoading || examsQuery.isError}
                >
                  <option value="">
                    {examsQuery.isLoading ? 'Loading exams…' : 'Select an exam'}
                  </option>
                  {(examsQuery.data?.items ?? []).map((item: AdminExam) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : null}
            <FormField id="notif-send-mode" label="Send">
              <select
                id="notif-send-mode"
                className="form-input"
                value={sendMode}
                onChange={(e) => setSendMode(e.target.value as SendMode)}
              >
                <option value="now">Now</option>
                <option value="schedule">Schedule</option>
              </select>
            </FormField>
            {sendMode === 'schedule' ? (
              <FormField id="notif-send-at" label="Send at">
                <input
                  id="notif-send-at"
                  type="datetime-local"
                  className="form-input"
                  value={sendAt}
                  onChange={(e) => setSendAt(e.target.value)}
                />
              </FormField>
            ) : null}
            <ActionButton variant="gold" onClick={handleSend} disabled={createMutation.isPending}>
              {sendMode === 'schedule' ? (
                <CalendarClock aria-hidden strokeWidth={1.8} />
              ) : (
                <Send aria-hidden strokeWidth={1.8} />
              )}
              {createMutation.isPending
                ? 'Sending…'
                : sendMode === 'schedule'
                  ? 'Schedule notification'
                  : 'Send notification'}
            </ActionButton>
          </div>
        </div>

        <div className="notifications-preview-col">
          <div className="sec-t" style={{ marginTop: 0 }}>
            Preview
          </div>
          <div className="push-preview">
            <div className="push-preview-icon" aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <div className="push-preview-copy">
              <strong>{title.trim() || 'Notification title'}</strong>
              <p>{body.trim() || 'Your message will appear here.'}</p>
              <div className="push-preview-meta">Sopaan · {audienceLabel}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sec-t">Recent sends</div>
      <DataTable
        rows={recentQuery.data?.items ?? []}
        emptyMessage="No notifications sent yet"
        isLoading={recentQuery.isLoading}
        error={recentQuery.isError ? recentQuery.error : undefined}
        onRetry={() => void recentQuery.refetch()}
        columns={[
          { key: 'title', header: 'Title', render: (row) => row.title },
          {
            key: 'audience',
            header: 'Audience',
            render: (row) => formatAudience(row),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <span
                className={`pill ${row.status === 'sent' ? 'p-pub' : row.status === 'scheduled' ? 'p-draft' : 'p-draft'}`}
              >
                {row.status}
              </span>
            ),
          },
          {
            key: 'sentAt',
            header: 'Send time',
            render: (row) => formatWhen(row.sentAt ?? row.sendAt),
          },
          {
            key: 'delivered',
            header: 'Delivered',
            render: (row) => row.stats.delivered,
          },
          {
            key: 'openRate',
            header: 'Open rate',
            align: 'right',
            render: (row) => (row.stats.delivered > 0 ? `${row.stats.openRate}%` : '—'),
          },
        ]}
      />
    </div>
  );
}
