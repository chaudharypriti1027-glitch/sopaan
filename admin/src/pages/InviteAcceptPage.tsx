import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { acceptTeamInviteSignup, fetchTeamInvite } from '../api/team';
import { persistSession } from '../api/storage';
import { BrandMark } from '../components/BrandMark';
import { FormField } from '../components/content/FormField';
import { isStaffRole } from '../auth/roles';
import { useAuth } from '../auth/AuthContext';
import '../styles/login.css';

export function InviteAcceptPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { setUser } = useAuth();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invite link is missing a token');
      setLoadingInvite(false);
      return;
    }

    fetchTeamInvite(token)
      .then((invite) => {
        setEmail(invite.email);
        setRole(invite.role);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingInvite(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setSubmitting(true);

    try {
      const result = await acceptTeamInviteSignup({
        name: name.trim(),
        email,
        password,
        inviteToken: token,
      });

      const userRole = result.user.role;
      if (!isStaffRole(userRole)) {
        throw new Error('Account created but team role was not applied');
      }

      persistSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: userRole,
        },
      });

      setUser({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: userRole,
      });

      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInvite) {
    return (
      <div className="login-loading">
        <div className="login-loading-card">
          <BrandMark size="sm" variant="dark" showTagline={false} />
          <div className="login-spinner" aria-hidden />
          <p>Loading invite…</p>
        </div>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="login-loading">
        <div className="login-form-card" style={{ width: 'min(100%, 420px)' }}>
          <BrandMark size="sm" variant="dark" showTagline={false} />
          <h2 style={{ marginTop: 18 }}>Invalid invite</h2>
          <p>{error}</p>
          <button type="button" className="login-submit" onClick={() => navigate('/login')}>
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <section className="login-hero">
        <div className="login-hero-inner">
          <BrandMark size="lg" variant="light" />
          <h1>
            You&apos;re invited to <em>Sopaan Admin</em>
          </h1>
          <p className="login-hero-lead">
            Complete your account to join the team as <strong>{role}</strong> and start managing
            content, students, and live classes.
          </p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <form className="login-form-card" onSubmit={handleSubmit}>
            <BrandMark size="sm" variant="dark" showTagline={false} />
            <h2>Create your account</h2>
            <p>
              Signing up as <strong>{role}</strong> for {email}
            </p>

            {error ? <div className="login-error">{error}</div> : null}

            <FormField id="invite-name" label="Full name">
              <input
                id="invite-name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </FormField>
            <FormField id="invite-email" label="Email">
              <input id="invite-email" className="form-input" type="email" value={email} readOnly />
            </FormField>
            <FormField id="invite-password" label="Password">
              <input
                id="invite-password"
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </FormField>

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
