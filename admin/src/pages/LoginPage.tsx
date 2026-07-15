import { useEffect, useState } from 'react';
import { AlertCircle, BookOpen, Eye, EyeOff, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchLoginHint, loginAdmin } from '../api/admin';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../auth/AuthContext';
import '../styles/login.css';

const FEATURES = [
  {
    title: 'Content at scale',
    body: 'Publish courses, tests, current affairs, and media from one console.',
    icon: <BookOpen aria-hidden strokeWidth={1.8} />,
  },
  {
    title: 'Live & learners',
    body: 'Run live classes, track students, and manage mentors in real time.',
    icon: <Users aria-hidden strokeWidth={1.8} />,
  },
  {
    title: 'Exam-ready ops',
    body: 'AI feedback, jobs, revenue, and platform settings — all in one place.',
    icon: <ShieldCheck aria-hidden strokeWidth={1.8} />,
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
                <AlertCircle aria-hidden strokeWidth={1.8} />
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
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden strokeWidth={1.8} />
                  ) : (
                    <Eye aria-hidden strokeWidth={1.8} />
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
