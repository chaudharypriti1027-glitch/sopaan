import { useQuery } from '@tanstack/react-query';
import { fetchAdminStats, fetchAttemptsSeries } from '../api/admin';
import { useAuth } from '../auth/AuthContext';
import { QueryErrorBanner } from '../components/QueryErrorBanner';
import { MetricCard } from '../components/MetricCard';
import { AttemptsChart } from '../components/dashboard/AttemptsChart';
import { ContentMixDonut } from '../components/dashboard/ContentMixDonut';
import { PriorityCard } from '../components/dashboard/PriorityCard';
import { SystemStatusCard } from '../components/dashboard/SystemStatusCard';
import { useAdminDashboardSocket } from '../hooks/useAdminDashboardSocket';

const METRIC_ICONS = {
  students: (
    <svg className="svg" viewBox="0 0 24 24" aria-hidden>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0M16 5a3.5 3.5 0 0 1 0 6" />
    </svg>
  ),
  attempts: (
    <svg className="svg" viewBox="0 0 24 24" aria-hidden>
      <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  tests: (
    <svg className="svg" viewBox="0 0 24 24" aria-hidden>
      <path d="M4 4h16v6a8 8 0 0 1-16 0zM4 20h16" />
    </svg>
  ),
  questions: (
    <svg className="svg" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
    </svg>
  ),
  courses: (
    <svg className="svg" viewBox="0 0 24 24" aria-hidden>
      <path d="M22 10 12 5 2 10l10 5z" />
    </svg>
  ),
  affairs: (
    <svg className="svg" viewBox="0 0 24 24" aria-hidden>
      <path d="M4 5h13v14H6a2 2 0 0 1-2-2z" />
    </svg>
  ),
  live: (
    <svg className="svg" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="5" width="14" height="14" rx="3" />
      <path d="m22 8-6 4 6 4z" />
    </svg>
  ),
  exams: (
    <svg className="svg" viewBox="0 0 24 24" aria-hidden>
      <path d="M22 10 12 5 2 10l10 5z" />
    </svg>
  ),
  mentors: (
    <svg className="svg" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
};

export function DashboardPage() {
  useAdminDashboardSocket();
  const { user } = useAuth();

  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
  });

  const attemptsQuery = useQuery({
    queryKey: ['admin', 'stats', 'attempts', 14],
    queryFn: () => fetchAttemptsSeries(14),
  });

  const stats = statsQuery.data;
  const animate = !statsQuery.isLoading && Boolean(stats);
  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div>
      <div className="greet">
        <div>
          <h2>Welcome back, {user?.name?.split(' ')[0] ?? 'Admin'}</h2>
          <p>Here&apos;s what needs your attention today · {dateLabel}</p>
        </div>
        <span className="rolechip">
          <svg className="svg" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2 4 5v6c0 5.5 3.8 8.4 8 10 4.2-1.6 8-4.5 8-10V5z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          ADMIN · PRO
        </span>
      </div>

      <SystemStatusCard />

      {statsQuery.isError ? (
        <QueryErrorBanner error={statsQuery.error} onRetry={() => void statsQuery.refetch()} />
      ) : null}

      <div className="prio">
        <PriorityCard
          tone="gold"
          count={stats?.pendingReviews ?? 0}
          label="Tests pending review"
          cta="Review now"
          to="/tests"
          animate={animate}
          icon={
            <svg className="svg" viewBox="0 0 24 24" aria-hidden>
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
        <PriorityCard
          tone="sage"
          count={stats?.pendingQuestionReviews ?? 0}
          label="Questions in review"
          cta="Open queue"
          to="/review"
          animate={animate}
          icon={
            <svg className="svg" viewBox="0 0 24 24" aria-hidden>
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          }
        />
        <PriorityCard
          tone="navy"
          count={stats?.aiFeedbackPending ?? 0}
          label="AI answers flagged"
          cta="Review flags"
          to="/ai-feedback"
          animate={animate}
          icon={
            <svg className="svg" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" />
            </svg>
          }
        />
      </div>

      <div className="sec-t">Platform analytics</div>
      <div className="metrics">
        <MetricCard
          label="Active students (30d)"
          value={stats?.activeStudents ?? 0}
          tone="navy"
          icon={METRIC_ICONS.students}
          animate={animate}
        />
        <MetricCard
          label="Total students"
          value={stats?.totalStudents ?? 0}
          tone="gold"
          icon={METRIC_ICONS.students}
          animate={animate}
        />
        <MetricCard
          label="Mock attempts (30d)"
          value={stats?.attemptsLast30Days ?? 0}
          tone="sage"
          icon={METRIC_ICONS.attempts}
          animate={animate}
        />
        <MetricCard
          label="Tests live"
          value={stats?.testsPublished ?? 0}
          tone="navy"
          icon={METRIC_ICONS.tests}
          animate={animate}
        />
        <MetricCard
          label="Tests pending"
          value={stats?.pendingReviews ?? 0}
          tone="gold"
          icon={METRIC_ICONS.attempts}
          animate={animate}
        />
        <MetricCard
          label="Questions in review"
          value={stats?.pendingQuestionReviews ?? 0}
          tone="gold"
          icon={METRIC_ICONS.questions}
          animate={animate}
        />
        <MetricCard
          label="Questions bank"
          value={stats?.questionsTotal ?? 0}
          tone="navy"
          icon={METRIC_ICONS.questions}
          animate={animate}
        />
        <MetricCard
          label="Courses published"
          value={stats?.coursesPublished ?? 0}
          tone="sage"
          icon={METRIC_ICONS.courses}
          animate={animate}
        />
        <MetricCard
          label="Current affairs live"
          value={stats?.currentAffairsPublished ?? 0}
          tone="gold"
          icon={METRIC_ICONS.affairs}
          animate={animate}
        />
        <MetricCard
          label="Live classes"
          value={stats?.liveClasses ?? 0}
          tone="navy"
          icon={METRIC_ICONS.live}
          animate={animate}
        />
        <MetricCard
          label="Exam catalog"
          value={stats?.examsTotal ?? 0}
          tone="sage"
          icon={METRIC_ICONS.exams}
          animate={animate}
        />
        <MetricCard
          label="Mentors"
          value={stats?.mentorsTotal ?? 0}
          tone="gold"
          icon={METRIC_ICONS.mentors}
          animate={animate}
        />
      </div>

      <div className="cols">
        <div className="panel">
          <div className="ph">
            <h3>Mock attempts</h3>
            <span className="sub">Last 14 days</span>
          </div>
          {attemptsQuery.isError ? (
            <QueryErrorBanner
              error={attemptsQuery.error}
              onRetry={() => void attemptsQuery.refetch()}
            />
          ) : attemptsQuery.isLoading ? (
            <p className="page-sub">Loading chart…</p>
          ) : (
            <AttemptsChart series={attemptsQuery.data?.series ?? []} />
          )}
        </div>
        <div className="panel">
          <div className="ph">
            <h3>Content mix</h3>
            <span className="sub">Published</span>
          </div>
          <ContentMixDonut
            questions={stats?.questionsPublished ?? 0}
            affairs={stats?.currentAffairsPublished ?? 0}
            courses={stats?.coursesPublished ?? 0}
            animate={animate}
          />
        </div>
      </div>
    </div>
  );
}
