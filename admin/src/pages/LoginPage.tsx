import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLoginHint, loginAdmin } from '../api/admin';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../auth/AuthContext';
import '../styles/login.css';

const FEATURES = [
  {
    title: 'Content at scale',
    body: 'Publish courses, tests, current affairs, and media from one console.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M4 5h13v14H6a2 2 0 0 1-2-2z" />
        <path d="M16 5h4v14h-4z" />
      </svg>
    ),
  },
  {
    title: 'Live & learners',
    body: 'Run live classes, track students, and manage mentors in real time.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 20a6 6 0 0 1 12 0M16 5a3.5 3.5 0 0 1 0 6" />
      </svg>
    ),
  },
  {
    title: 'Exam-ready ops',
    body: 'AI feedback, jobs, revenue, and platform settings — all in one place.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2 4 5v6c0 5.5 3.8 8.4 8 10 4.2-1.6 8-4.5 8-10V5z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser, isStaff, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  if (loading) {
    return (
      <div className="login-loading">
        <div className="login-loading-card">
          <div className="login-spinner" aria-hidden />
          <p>Verifying your session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <section className="login-hero" aria-hidden={false}>
        <div className="login-hero-inner">
          <BrandMark size="lg" variant="light" />
          <h1>
            Run your <em>exam prep</em> platform with confidence
          </h1>
          <p className="login-hero-lead">
            The Sopaan admin console gives your team one premium workspace to create content,
            engage students, and grow revenue.
          </p>
        </div>

        <div className="login-features">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="login-feature">
              <div className="login-feature-icon">{feature.icon}</div>
              <div>
                <strong>{feature.title}</strong>
                <span>{feature.body}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <form className="login-form-card" onSubmit={handleSubmit}>
            <BrandMark size="sm" variant="dark" showTagline={false} />
            <h2>Welcome back</h2>
            <p>Sign in with your team account to open the admin console.</p>

            {error ? (
              <div className="login-error" role="alert">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
                <span>{error}</span>
              </div>
            ) : null}

            <div className="login-field">
              <label htmlFor="email">Work email</label>
              <div className="login-input-wrap">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="you@sopaan.com"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-input-wrap has-toggle">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="login-toggle-pw"
                  onClick={() => setShowPassword((open) => !open)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M6.7 6.7C4.6 8.1 3 10.2 2 12c1.5 3 5 5 10 5 1.8 0 3.5-.4 5-1.1" />
                      <path d="M17.3 17.3c2.1-1.4 3.7-3.5 4.7-5.3-1.5-3-5-5-10-5-1.1 0-2.1.1-3 .4" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <path d="M2 12s3.5-5 10-5 10 5 10 5-3.5 5-10 5-10-5-10-5z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in to console'}
            </button>

            <p className="login-footnote">Team access only · admin, creator, or moderator</p>
          </form>
        </div>
      </section>
    </div>
  );
}
