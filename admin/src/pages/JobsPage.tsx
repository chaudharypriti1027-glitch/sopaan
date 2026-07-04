import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  listAdminJobs,
  listJobRuns,
  runAdminJob,
  type AdminJobDefinition,
  type JobRun,
} from '../api/jobs';
import { DataTable } from '../components/DataTable';
import { useToast } from '../components/Toast';
import './jobs.css';

function formatWhen(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function statusPill(status: string) {
  switch (status) {
    case 'completed':
      return { label: 'Success', className: 'p-pub' };
    case 'failed':
      return { label: 'Failed', className: 'p-rej' };
    case 'running':
      return { label: 'Running', className: 'p-rev' };
    case 'never_run':
      return { label: 'Never run', className: 'p-draft' };
    default:
      return { label: status, className: 'p-draft' };
  }
}

function jobTitle(name: string) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function JobsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [runningJob, setRunningJob] = useState<string | null>(null);

  const jobsQuery = useQuery({
    queryKey: ['admin', 'jobs'],
    queryFn: listAdminJobs,
  });

  const runsQuery = useQuery({
    queryKey: ['admin', 'jobs', 'runs'],
    queryFn: () => listJobRuns(40),
    refetchInterval: runningJob ? 2000 : false,
  });

  const runMutation = useMutation({
    mutationFn: (jobName: string) => runAdminJob(jobName, true),
    onMutate: (jobName) => setRunningJob(jobName),
    onSuccess: (result, jobName) => {
      if (result.queued) {
        showToast(`${jobTitle(jobName)} queued — waiting for worker`);
      } else if (result.skipped) {
        showToast(`${jobTitle(jobName)} skipped (${result.reason ?? 'already ran'})`);
        setRunningJob(null);
      } else {
        showToast(`${jobTitle(jobName)} completed`);
        setRunningJob(null);
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs', 'runs'] });
    },
    onError: (err: Error) => {
      showToast(err.message);
      setRunningJob(null);
    },
  });

  const jobs = (jobsQuery.data?.items ?? []).map((job) => ({ ...job, id: job.name }));
  const runs = runsQuery.data?.items ?? [];

  useEffect(() => {
    if (!runningJob) {
      return;
    }

    const latest = runs.find((run) => run.jobName === runningJob);
    if (latest && latest.status !== 'running') {
      setRunningJob(null);
    }
  }, [runs, runningJob]);

  return (
    <div className="jobs-page">
      <p className="jobs-note">
        Scheduled background jobs. &quot;Run now&quot; enqueues via BullMQ when Redis is available,
        otherwise runs immediately. History records success or failure per run.
      </p>

      <div className="sec-t jobs-section-title" style={{ marginTop: 0 }}>
        Scheduled jobs
      </div>
      <div className="panel">
        <DataTable<AdminJobDefinition>
          rows={jobs}
          emptyMessage={jobsQuery.isLoading ? 'Loading jobs…' : 'No jobs configured'}
          columns={[
            {
              key: 'name',
              header: 'Job',
              render: (row) => (
                <div>
                  <strong>{jobTitle(row.name)}</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.description}</div>
                </div>
              ),
            },
            {
              key: 'schedule',
              header: 'Schedule',
              render: (row) => (
                <div>
                  <code>{row.schedule}</code>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.timezone}</div>
                </div>
              ),
            },
            {
              key: 'last',
              header: 'Last run',
              render: (row) => formatWhen(row.lastRun?.startedAt),
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
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <div className="act">
                  <button
                    type="button"
                    className="abtn pri"
                    disabled={runMutation.isPending || !row.enabled}
                    onClick={() => runMutation.mutate(row.name)}
                  >
                    {runningJob === row.name && runMutation.isPending ? 'Running…' : 'Run now'}
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <div className="sec-t">Run history</div>
      <div className="panel">
        <DataTable<JobRun>
          rows={runs}
          emptyMessage={runsQuery.isLoading ? 'Loading history…' : 'No job runs yet'}
          columns={[
            {
              key: 'job',
              header: 'Job',
              render: (row) => jobTitle(row.jobName),
            },
            {
              key: 'runKey',
              header: 'Run key',
              render: (row) => row.runKey,
            },
            {
              key: 'started',
              header: 'Started',
              render: (row) => formatWhen(row.startedAt),
            },
            {
              key: 'trigger',
              header: 'Trigger',
              render: (row) => row.triggeredBy,
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
              key: 'error',
              header: 'Details',
              render: (row) =>
                row.status === 'failed'
                  ? row.error ?? 'Failed'
                  : row.result
                    ? JSON.stringify(row.result).slice(0, 80)
                    : '—',
            },
          ]}
        />
      </div>
    </div>
  );
}
