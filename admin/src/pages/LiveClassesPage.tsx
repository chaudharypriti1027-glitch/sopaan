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
import { connectAdminLiveSocket, disconnectAdminLiveSocket } from '../realtime/liveSocket';
import '../components/live/live-room.css';

type LiveTab = 'room' | 'schedule' | 'upcoming' | 'recordings';

const defaultForm = {
  title: '',
  description: '',
  instructor: '',
  exam: 'General',
  topic: '',
  startsAt: '',
  durationMin: '60',
  autoRecord: true,
  notify: true,
  coverUrl: '',
};

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
  const [tab, setTab] = useState<LiveTab>('room');
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const query = useQuery({
    queryKey: ['admin', 'live-classes'],
    queryFn: () => listAdminLiveClasses(),
  });

  const recordingsQuery = useQuery({
    queryKey: ['admin', 'live-classes', 'ended'],
    queryFn: () => listAdminLiveClasses('ended'),
    enabled: tab === 'recordings',
  });

  const items = query.data?.items ?? [];
  const liveNow = items.find((row) => row.status === 'live') ?? null;
  const upcoming = items.filter((row) => row.status === 'scheduled');
  const recordings = (recordingsQuery.data?.items ?? items).filter(
    (row) => row.status === 'ended' && row.recordingUrl,
  );

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
      showToast('Live class scheduled');
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-classes'] });
      setForm(defaultForm);
      setTab('upcoming');
    },
    onError: (err: Error) => showToast(err.message),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startAdminLiveClass(id),
    onSuccess: (row) => {
      showToast('Class is live');
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-classes'] });
      setActiveClassId(row.id);
      setTab('room');
    },
    onError: (err: Error) => showToast(err.message),
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => endAdminLiveClass(id),
    onSuccess: () => {
      showToast('Class ended · recording saved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-classes'] });
      setActiveClassId(null);
      setTab('recordings');
    },
    onError: (err: Error) => showToast(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelAdminLiveClass(id),
    onSuccess: () => {
      showToast('Class cancelled');
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-classes'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      setAdminLiveClassRecordingPublished(id, published),
    onSuccess: (_row, vars) => {
      showToast(vars.published ? 'Recording published' : 'Recording unpublished');
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-classes'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  function handleCreate() {
    if (!form.title.trim() || !form.startsAt) {
      showToast('Title and schedule are required');
      return;
    }

    createMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      instructor: form.instructor.trim() || undefined,
      exam: form.exam.trim() || 'General',
      topic: form.topic.trim() || undefined,
      startsAt: new Date(form.startsAt).toISOString(),
      durationMin: Number(form.durationMin) || 60,
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
      <div className="sec-t">Live classes</div>

      <div className="metrics">
        <div className="metric">
          <div className="k">Live now</div>
          <div className="v num">{query.data?.summary.liveCount ?? 0}</div>
        </div>
        <div className="metric">
          <div className="k">Scheduled</div>
          <div className="v num">{query.data?.summary.scheduledCount ?? 0}</div>
        </div>
        <div className="metric">
          <div className="k">Recordings</div>
          <div className="v num">{query.data?.summary.recordingCount ?? 0}</div>
        </div>
        <div className="metric">
          <div className="k">Watching now</div>
          <div className="v num">{query.data?.summary.watchingNow ?? 0}</div>
        </div>
      </div>

      <div className="subtabs">
        <button
          type="button"
          className={`subtab ${tab === 'room' ? 'on' : ''}`}
          onClick={() => setTab('room')}
        >
          {liveNow ? <span className="lv" /> : null}
          Live now
        </button>
        <button
          type="button"
          className={`subtab ${tab === 'schedule' ? 'on' : ''}`}
          onClick={() => setTab('schedule')}
        >
          Schedule
        </button>
        <button
          type="button"
          className={`subtab ${tab === 'upcoming' ? 'on' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          type="button"
          className={`subtab ${tab === 'recordings' ? 'on' : ''}`}
          onClick={() => setTab('recordings')}
        >
          Recordings
        </button>
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
              ? 'Starting live room…'
              : liveNow
                ? 'Unable to load host token. Check LiveKit configuration.'
                : 'No class is live. Start one from Upcoming.'}
          </div>
        )
      ) : null}

      {tab === 'schedule' ? (
        <div className="panel" style={{ maxWidth: 760 }}>
          <div className="ph">
            <h3>Schedule a live class</h3>
          </div>
          <div className="drawer-form" style={{ padding: '0 16px 16px' }}>
            <FormField id="live-title" label="Title">
              <input
                id="live-title"
                className="form-input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </FormField>
            <FormField id="live-instructor" label="Educator">
              <input
                id="live-instructor"
                className="form-input"
                value={form.instructor}
                onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))}
              />
            </FormField>
            <FormField id="live-exam" label="Exam">
              <input
                id="live-exam"
                className="form-input"
                value={form.exam}
                onChange={(e) => setForm((f) => ({ ...f, exam: e.target.value }))}
              />
            </FormField>
            <FormField id="live-topic" label="Topic">
              <input
                id="live-topic"
                className="form-input"
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              />
            </FormField>
            <FormField id="live-when" label="Date & time">
              <input
                id="live-when"
                type="datetime-local"
                className="form-input"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
              />
            </FormField>
            <FormField id="live-duration" label="Duration (minutes)">
              <input
                id="live-duration"
                type="number"
                min={15}
                max={240}
                className="form-input"
                value={form.durationMin}
                onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
              />
            </FormField>
            <FormField id="live-auto-record" label="Auto-record">
              <select
                id="live-auto-record"
                className="form-input"
                value={form.autoRecord ? 'on' : 'off'}
                onChange={(e) => setForm((f) => ({ ...f, autoRecord: e.target.value === 'on' }))}
              >
                <option value="on">On — save to recordings</option>
                <option value="off">Off</option>
              </select>
            </FormField>
            <CoverImageField
              label="Cover image"
              value={form.coverUrl}
              onChange={(url) => setForm((f) => ({ ...f, coverUrl: url }))}
            />
            <label className="form-check" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={form.notify}
                onChange={(e) => setForm((f) => ({ ...f, notify: e.target.checked }))}
              />
              Notify students (push + in-app banner)
            </label>
            <ActionButton
              variant="gold"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              Schedule &amp; notify students
            </ActionButton>
          </div>
        </div>
      ) : null}

      {tab === 'upcoming' ? (
        <>
          <div className="toolbar">
            <ActionButton variant="gold" onClick={() => setTab('schedule')}>
              Schedule class
            </ActionButton>
          </div>
          <DataTable
            rows={[...(liveNow ? [liveNow] : []), ...upcoming]}
            emptyMessage={query.isLoading ? 'Loading classes…' : 'No upcoming classes'}
            columns={[
              { key: 'title', header: 'Class', render: (row) => row.title },
              { key: 'instructor', header: 'Educator', render: (row) => row.instructor },
              {
                key: 'when',
                header: 'When',
                render: (row) =>
                  row.status === 'live' ? 'Now' : formatWhen(row.startsAt ?? row.scheduledAt),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <span className={`pill ${row.status === 'live' ? 'p-live' : 'p-draft'}`}>
                    {row.status === 'live' ? 'Live' : 'Scheduled'}
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
                      {row.status === 'live' ? 'Open room' : 'Go live'}
                    </button>
                    {row.status === 'scheduled' ? (
                      <button
                        type="button"
                        className="abtn no"
                        onClick={() => cancelMutation.mutate(row.id)}
                      >
                        Cancel
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
          emptyMessage={recordingsQuery.isLoading ? 'Loading recordings…' : 'No recordings yet'}
          columns={[
            { key: 'title', header: 'Recording', render: (row) => row.title },
            { key: 'instructor', header: 'Educator', render: (row) => row.instructor },
            {
              key: 'duration',
              header: 'Duration',
              render: (row) => formatDuration(row),
            },
            {
              key: 'views',
              header: 'Peak viewers',
              render: (row) => row.viewersPeak ?? row.viewers ?? 0,
            },
            {
              key: 'status',
              header: 'Status',
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
                    ? 'Published'
                    : row.recordingStatus === 'ready'
                      ? 'Ready'
                      : row.recordingStatus ?? 'Pending'}
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
                      Open
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
                        Unpublish
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="abtn pri"
                        disabled={publishMutation.isPending}
                        onClick={() => publishMutation.mutate({ id: row.id, published: true })}
                      >
                        Publish
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
