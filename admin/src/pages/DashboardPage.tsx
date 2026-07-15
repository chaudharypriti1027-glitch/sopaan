import { useQuery } from '@tanstack/react-query';
import {
  BookOpenCheck,
  CircleHelp,
  ClipboardCheck,
  FileWarning,
  GraduationCap,
  LibraryBig,
  Newspaper,
  Radio,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';
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
  students: <UsersRound aria-hidden strokeWidth={1.8} />,
  attempts: <ClipboardCheck aria-hidden strokeWidth={1.8} />,
  tests: <BookOpenCheck aria-hidden strokeWidth={1.8} />,
  questions: <CircleHelp aria-hidden strokeWidth={1.8} />,
  courses: <LibraryBig aria-hidden strokeWidth={1.8} />,
  affairs: <Newspaper aria-hidden strokeWidth={1.8} />,
  live: <Radio aria-hidden strokeWidth={1.8} />,
  exams: <GraduationCap aria-hidden strokeWidth={1.8} />,
  mentors: <UserRoundCheck aria-hidden strokeWidth={1.8} />,
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
          <ShieldCheck aria-hidden strokeWidth={1.8} />
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
          icon={<ClipboardCheck aria-hidden strokeWidth={1.8} />}
        />
        <PriorityCard
          tone="sage"
          count={stats?.pendingQuestionReviews ?? 0}
          label="Questions in review"
          cta="Open queue"
          to="/review"
          animate={animate}
          icon={<FileWarning aria-hidden strokeWidth={1.8} />}
        />
        <PriorityCard
          tone="navy"
          count={stats?.aiFeedbackPending ?? 0}
          label="AI answers flagged"
          cta="Review flags"
          to="/ai-feedback"
          animate={animate}
          icon={<Sparkles aria-hidden strokeWidth={1.8} />}
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
