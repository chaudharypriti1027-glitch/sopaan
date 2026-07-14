import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { ADMIN_ONLY_PATHS } from './roles';
import { useAuth } from './AuthContext';
import '../styles/login.css';

export function ProtectedRoute() {
  const { user, loading, isStaff } = useAuth();

  if (loading) {
    return (
      <div className="login-loading">
        <div className="login-loading-card">
          <BrandMark size="sm" variant="dark" showTagline={false} />
          <div className="login-spinner" aria-hidden />
          <p>Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!user || !isStaff) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function AdminOnlyRoute() {
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();

  if (!isAdmin && ADMIN_ONLY_PATHS.has(pathname)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
