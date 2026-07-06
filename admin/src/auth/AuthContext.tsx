import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchAdminStats } from '../api/admin';
import { clearSession, getAccessToken, getStoredUser } from '../api/storage';
import type { AuthUser } from '../api/types';
import { disconnectAdminSocket } from '../realtime/adminSocket';
import { disconnectAdminLiveSocket } from '../realtime/liveSocket';
import { isAdminRole, isStaffRole } from './roles';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function staffUserFromStorage() {
  const stored = getStoredUser();
  if (!stored || !isStaffRole(stored.role)) return null;
  return {
    id: stored.id,
    name: stored.name,
    email: stored.email,
    role: stored.role as AuthUser['role'],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => staffUserFromStorage());
  const [loading, setLoading] = useState(Boolean(getAccessToken()));

  const logout = useCallback(() => {
    disconnectAdminSocket();
    disconnectAdminLiveSocket();
    clearSession();
    setUser(null);
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetchAdminStats()
      .then(() => {
        if (!cancelled) {
          const stored = staffUserFromStorage();
          if (stored) {
            setUser(stored);
          } else {
            logout();
          }
        }
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isStaff: Boolean(user && isStaffRole(user.role)),
      isAdmin: isAdminRole(user?.role),
      logout,
      setUser,
    }),
    [user, loading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
