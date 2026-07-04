import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute, AdminOnlyRoute } from './auth/ProtectedRoute';
import { ToastProvider } from './components/Toast';
import { ExamGenerateProvider } from './exam/ExamGenerateContext';
import { Shell } from './components/layout/Shell';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { RolesPage } from './pages/RolesPage';
import { InviteAcceptPage } from './pages/InviteAcceptPage';
import { ExamsPage } from './pages/ExamsPage';
import { CoursesPage } from './pages/CoursesPage';
import { CurrentAffairsPage } from './pages/CurrentAffairsPage';
import { MediaPage } from './pages/MediaPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { CouponsPage } from './pages/CouponsPage';
import { RevenuePage } from './pages/RevenuePage';
import { AiFeedbackPage } from './pages/AiFeedbackPage';
import { JobsPage } from './pages/JobsPage';
import { LiveClassesPage } from './pages/LiveClassesPage';
import { MentorsPage } from './pages/MentorsPage';
import { StudentsPage } from './pages/StudentsPage';
import { TestsPage } from './pages/TestsPage';
import { QuestionsPage } from './pages/QuestionsPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ExamGenerateProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/invite" element={<InviteAcceptPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AdminOnlyRoute />}>
                  <Route element={<Shell />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="questions" element={<QuestionsPage />} />
                  <Route path="review" element={<ReviewQueuePage />} />
                  <Route path="tests" element={<TestsPage />} />
                  <Route path="exams" element={<ExamsPage />} />
                  <Route path="courses" element={<CoursesPage />} />
                  <Route path="affairs" element={<CurrentAffairsPage />} />
                  <Route path="media" element={<MediaPage />} />
                  <Route path="students" element={<StudentsPage />} />
                  <Route path="mentors" element={<MentorsPage />} />
                  <Route path="live" element={<LiveClassesPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="announcements" element={<AnnouncementsPage />} />
                  <Route path="coupons" element={<CouponsPage />} />
                  <Route path="revenue" element={<RevenuePage />} />
                  <Route path="ai-feedback" element={<AiFeedbackPage />} />
                  <Route path="jobs" element={<JobsPage />} />
                  <Route path="roles" element={<RolesPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </BrowserRouter>
          </ExamGenerateProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
