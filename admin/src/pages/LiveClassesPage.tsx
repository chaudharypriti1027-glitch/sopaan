import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  cancelAdminLiveClass,
  createAdminLiveClass,
  endAdminLiveClass,
  fetchLiveHostToken,
  listAdminLiveClasses,
  setAdminLiveClassRecordingPublished,
  startAdminLiveClass,
  type AdminLiveClass,
  type LiveClassCreateInput,
} from '../api/liveClasses';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/content/FormField';
import { LiveControlRoom } from '../components/live/LiveControlRoom';
import { CoverImageField } from '../components/media/MediaPicker';
import { useToast } from '../components/Toast';
import {
  DEFAULT_LIVE_CLASS_FORM,
  LIVE_ADMIN_COPY,
  LIVE_ADMIN_TABS,
  LIVE_CLASS_DURATION,
  type LiveAdminTab,
  type LiveClassFormState,
} from '../content/liveClassesContent';
import { connectAdminLiveSocket, disconnectAdminLiveSocket } from '../realtime/liveSocket';
import { useAdminLiveClassesRealtime } from '../hooks/useAdminLiveClassesRealtime';
import '../components/live/live-room.css';

const copy = LIVE_ADMIN_COPY;

function formatDuration(row: AdminLiveClass) {
  if (row.recordingDurationSec && row.recordingDurationSec > 0) {
    const minutes = Math.max(1, Math.round(row.recordingDurationSec / 60));
    return `${minutes} min`;
  }
  return `${row.durationMin} min`;
}

function formatWhen(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function LiveClassesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<LiveAdminTab>('upcoming');
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [form, setForm] = useState<LiveClassFormState>({ ...DEFAULT_LIVE_CLASS_FORM });

  const query = useQuery({
    queryKey: ['admin', 'live-classes'],
    queryFn: () => listAdminLiveClasses(),
    refetchOnWindowFocus: true,
    refetchInterval: (q) => ((q.state.data?.summary.liveCount ?? 0) > 0 ? 8_000 : false),
  });

  const recordingsQuery = useQuery({
    queryKey: ['admin', 'live-classes', 'ended'],
    queryFn: () => listAdminLiveClasses('ended'),
    enabled: tab === 'recordings',
  });

  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const liveNow = items.find((row) => row.status === 'live') ?? null;
  const upcoming = items.filter((row) => row.status === 'scheduled');
  const recordings = (recordingsQuery.data?.items ?? items).filter(
    (row) => row.status === 'ended' && row.recordingUrl,
  );

  const hasLiveClasses = (query.data?.summary.liveCount ?? 0) > 0;
  useAdminLiveClassesRealtime(hasLiveClasses || tab === 'room');

  useEffect(() => {
    if (liveNow && tab === 'room' && !activeClassId) {
      setActiveClassId(liveNow.id);
    }
  }, [liveNow, tab, activeClassId]);

  useEffect(() => {
    if (tab === 'room' && activeClassId) {
      connectAdminLiveSocket();
      return () => disconnectAdminLiveSocket();
    }
    return undefined;
  }, [tab, activeClassId]);

  const activeClass = useMemo(
    () => items.find((row) => row.id === activeClassId) ?? liveNow,
    [items, activeClassId, liveNow],
  );

  const tokenQuery = useQuery({
    queryKey: ['admin', 'live-token', activeClassId],
    queryFn: () => fetchLiveHostToken(activeClassId!),
    enabled: tab === 'room' && Boolean(activeClassId) && activeClass?.status === 'live',
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: (body: LiveClassCreateInput) => createAdminLiveClass(body),
    onSuccess: () => {
      showToast(copy.toast.scheduled);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'live-classes'] });
      setForm({ ...DEFAULT_LIVE_CLASS_FORM });
      setTab('upcoming');
    },
    onError: (err: Error) => showToast(err.message),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startAdminLiveClass(id),
    onSuccess: (row) => {
      showToast(copy.toast.live);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'live-classes'] });
      setActiveClassId(row.id);
      setTab('room');
    },
    onError: (err: Error) => showToast(err.message),
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => endAdminLiveClass(id),
    onSuccess: () => {
      showToast(copy.toast.ended);
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-classes'] });
      setActiveClassId(null);
      setTab('recordings');
    },
    onError: (err: Error) => showToast(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelAdminLiveClass(id),
    onSuccess: () => {
      showToast(copy.toast.cancelled);
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-classes'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      setAdminLiveClassRecordingPublished(id, published),
    onSuccess: (_row, vars) => {
      showToast(vars.published ? copy.toast.published : copy.toast.unpublished);
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-classes'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  function handleCreate() {
    if (!form.title.trim() || !form.startsAt) {
      showToast(copy.toast.required);
      return;
    }

    createMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      instructor: form.instructor.trim() || undefined,
      exam: form.exam.trim() || DEFAULT_LIVE_CLASS_FORM.exam,
      topic: form.topic.trim() || undefined,
      startsAt: new Date(form.startsAt).toISOString(),
      durationMin: Number(form.durationMin) || LIVE_CLASS_DURATION.default,
      coverUrl: form.coverUrl.trim() || undefined,
      autoRecord: form.autoRecord,
      notify: form.notify,
    });
  }

  function openRoom(row: AdminLiveClass) {
    if (row.status === 'scheduled') {
      startMutation.mutate(row.id);
      return;
    }

    setActiveClassId(row.id);
    setTab('room');
  }

  const hostCredentials =
    tokenQuery.data?.token && tokenQuery.data.url
      ? { url: tokenQuery.data.url, token: tokenQuery.data.token }
      : null;

  return (
    <div className="live-page">
      <div className="sec-t">{copy.pageTitle}</div>

      <div className="metrics">
        <div className="metric">
          <div className="k">{copy.metrics.liveNow}</div>
          <div className="v num">{query.data?.summary.liveCount ?? 0}</div>
        </div>
        <div className="metric">
          <div className="k">{copy.metrics.scheduled}</div>
          <div className="v num">{query.data?.summary.scheduledCount ?? 0}</div>
        </div>
        <div className="metric">
          <div className="k">{copy.metrics.recordings}</div>
          <div className="v num">{query.data?.summary.recordingCount ?? 0}</div>
        </div>
        <div className="metric">
          <div className="k">{copy.metrics.watchingNow}</div>
          <div className="v num">{query.data?.summary.watchingNow ?? 0}</div>
        </div>
      </div>

      <div className="subtabs">
        {LIVE_ADMIN_TABS.map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            className={`subtab ${tab === key ? 'on' : ''}`}
            onClick={() => setTab(key)}
          >
            {key === 'room' && liveNow ? <span className="lv" /> : null}
            {copy.tabs[labelKey]}
          </button>
        ))}
      </div>

      {tab === 'room' ? (
        activeClass?.status === 'live' && hostCredentials && activeClass ? (
          <LiveControlRoom
            liveClass={activeClass}
            credentials={hostCredentials}
            ending={endMutation.isPending}
            onEndClass={async () => {
              await endMutation.mutateAsync(activeClass.id);
            }}
            onEnded={() => {
              setActiveClassId(null);
            }}
          />
        ) : (
          <div className="live-empty">
            {tokenQuery.isLoading || startMutation.isPending
              ? copy.room.starting
              : liveNow
                ? copy.room.tokenError
                : copy.room.empty}
          </div>
        )
      ) : null}

      {tab === 'schedule' ? (
        <div className="panel" style={{ maxWidth: 760 }}>
          <div className="ph">
            <h3>{copy.schedule.title}</h3>
          </div>
          <div className="drawer-form" style={{ padding: '0 16px 16px' }}>
            <FormField id="live-title" label={copy.fields.title}>
              <input
                id="live-title"
                className="form-input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </FormField>
            <FormField id="live-instructor" label={copy.fields.educator}>
              <input
                id="live-instructor"
                className="form-input"
                value={form.instructor}
                onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))}
              />
            </FormField>
            <FormField id="live-exam" label={copy.fields.exam}>
              <input
                id="live-exam"
                className="form-input"
                value={form.exam}
                onChange={(e) => setForm((f) => ({ ...f, exam: e.target.value }))}
              />
            </FormField>
            <FormField id="live-topic" label={copy.fields.topic}>
              <input
                id="live-topic"
                className="form-input"
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              />
            </FormField>
            <FormField id="live-when" label={copy.fields.when}>
              <input
                id="live-when"
                type="datetime-local"
                className="form-input"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
              />
            </FormField>
            <FormField id="live-duration" label={copy.fields.duration}>
              <input
                id="live-duration"
                type="number"
                min={LIVE_CLASS_DURATION.min}
                max={LIVE_CLASS_DURATION.max}
                className="form-input"
                value={form.durationMin}
                onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
              />
            </FormField>
            <FormField id="live-auto-record" label={copy.fields.autoRecord}>
              <select
                id="live-auto-record"
                className="form-input"
                value={form.autoRecord ? 'on' : 'off'}
                onChange={(e) => setForm((f) => ({ ...f, autoRecord: e.target.value === 'on' }))}
              >
                <option value="on">{copy.schedule.autoRecordOn}</option>
                <option value="off">{copy.schedule.autoRecordOff}</option>
              </select>
            </FormField>
            <CoverImageField
              label={copy.fields.cover}
              value={form.coverUrl}
              onChange={(url) => setForm((f) => ({ ...f, coverUrl: url }))}
            />
            <label className="form-check" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={form.notify}
                onChange={(e) => setForm((f) => ({ ...f, notify: e.target.checked }))}
              />
              {copy.schedule.notifyLabel}
            </label>
            <ActionButton
              variant="gold"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {copy.schedule.submit}
            </ActionButton>
          </div>
        </div>
      ) : null}

      {tab === 'upcoming' ? (
        <>
          <div className="toolbar">
            <ActionButton variant="gold" onClick={() => setTab('schedule')}>
              {copy.upcoming.scheduleBtn}
            </ActionButton>
          </div>
          <DataTable
            rows={[...(liveNow ? [liveNow] : []), ...upcoming]}
            emptyMessage={copy.upcoming.empty}
            isLoading={query.isLoading}
            error={query.isError ? query.error : undefined}
            onRetry={() => void query.refetch()}
            columns={[
              { key: 'title', header: copy.upcoming.columns.class, render: (row) => row.title },
              {
                key: 'instructor',
                header: copy.upcoming.columns.educator,
                render: (row) => row.instructor,
              },
              {
                key: 'when',
                header: copy.upcoming.columns.when,
                render: (row) =>
                  row.status === 'live' ? copy.upcoming.now : formatWhen(row.startsAt ?? row.scheduledAt),
              },
              {
                key: 'status',
                header: copy.upcoming.columns.status,
                render: (row) => (
                  <span className={`pill ${row.status === 'live' ? 'p-live' : 'p-draft'}`}>
                    {row.status === 'live' ? copy.upcoming.statusLive : copy.upcoming.statusScheduled}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (row) => (
                  <div className="act">
                    <button type="button" className="abtn pri" onClick={() => openRoom(row)}>
                      {row.status === 'live' ? copy.upcoming.openRoom : copy.upcoming.goLive}
                    </button>
                    {row.status === 'scheduled' ? (
                      <button
                        type="button"
                        className="abtn no"
                        onClick={() => cancelMutation.mutate(row.id)}
                      >
                        {copy.upcoming.cancel}
                      </button>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        </>
      ) : null}

      {tab === 'recordings' ? (
        <DataTable
          rows={recordings}
          emptyMessage={copy.recordings.empty}
          isLoading={recordingsQuery.isLoading}
          error={recordingsQuery.isError ? recordingsQuery.error : undefined}
          onRetry={() => void recordingsQuery.refetch()}
          columns={[
            {
              key: 'title',
              header: copy.recordings.columns.recording,
              render: (row) => row.title,
            },
            {
              key: 'instructor',
              header: copy.recordings.columns.educator,
              render: (row) => row.instructor,
            },
            {
              key: 'duration',
              header: copy.recordings.columns.duration,
              render: (row) => formatDuration(row),
            },
            {
              key: 'views',
              header: copy.recordings.columns.peakViewers,
              render: (row) => row.viewersPeak ?? row.viewers ?? 0,
            },
            {
              key: 'status',
              header: copy.recordings.columns.status,
              render: (row) => (
                <span
                  className={`pill ${
                    row.recordingPublished
                      ? 'p-pub'
                      : row.recordingStatus === 'ready'
                        ? 'p-draft'
                        : 'p-draft'
                  }`}
                >
                  {row.recordingPublished
                    ? copy.recordings.statusPublished
                    : row.recordingStatus === 'ready'
                      ? copy.recordings.statusReady
                      : row.recordingStatus ?? copy.recordings.statusPending}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <div className="act">
                  {row.recordingUrl ? (
                    <a className="abtn" href={row.recordingUrl} target="_blank" rel="noreferrer">
                      {copy.recordings.open}
                    </a>
                  ) : null}
                  {row.recordingStatus === 'ready' ? (
                    row.recordingPublished ? (
                      <button
                        type="button"
                        className="abtn no"
                        disabled={publishMutation.isPending}
                        onClick={() => publishMutation.mutate({ id: row.id, published: false })}
                      >
                        {copy.recordings.unpublish}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="abtn pri"
                        disabled={publishMutation.isPending}
                        onClick={() => publishMutation.mutate({ id: row.id, published: true })}
                      >
                        {copy.recordings.publish}
                      </button>
                    )
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      ) : null}
    </div>
  );
}
