import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLoginHint, loginAdmin } from '../api/admin';
import { ActionButton } from '../components/ActionButton';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser, isStaff, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isStaff) {
      navigate('/', { replace: true });
    }
  }, [loading, isStaff, navigate]);

  useEffect(() => {
    fetchLoginHint().then((hint) => {
      if (hint) setEmail(hint);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await loginAdmin(email, password);
      const role = result.profile.role ?? 'student';
      setUser({
        id: result.profile.id,
        name: result.profile.name,
        email: result.profile.email,
        role: role as 'admin' | 'creator' | 'moderator',
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Sopaan Admin</h1>
        <p>Sign in with a team account to open the console.</p>
        {error ? <div className="login-error">{error}</div> : null}
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <ActionButton variant="gold" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </ActionButton>
      </form>
    </div>
  );
}
