import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { acceptTeamInviteSignup, fetchTeamInvite } from '../api/team';
import { persistSession } from '../api/storage';
import { ActionButton } from '../components/ActionButton';
import { FormField } from '../components/content/FormField';
import { isStaffRole } from '../auth/roles';
import { useAuth } from '../auth/AuthContext';

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
      <div className="login-wrap">
        <div className="login-card">
          <p>Loading invite…</p>
        </div>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <h1>Invalid invite</h1>
          <p>{error}</p>
          <ActionButton variant="gold" onClick={() => navigate('/login')}>
            Go to login
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Join Sopaan Admin</h1>
        <p>
          Create your account as <strong>{role}</strong> for {email}.
        </p>
        {error ? <div className="login-error">{error}</div> : null}
        <FormField id="invite-name" label="Full name">
          <input
            id="invite-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </FormField>
        <FormField id="invite-email" label="Email">
          <input id="invite-email" type="email" value={email} readOnly />
        </FormField>
        <FormField id="invite-password" label="Password">
          <input
            id="invite-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </FormField>
        <ActionButton variant="gold" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </ActionButton>
      </form>
    </div>
  );
}
