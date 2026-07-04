import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  inviteTeamMember,
  listTeamMembers,
  removeTeamMember,
  updateTeamMemberRole,
  type TeamMember,
} from '../api/team';
import type { UserRole } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/content/FormField';
import { useToast } from '../components/Toast';
import './roles.css';

const TEAM_ROLES: UserRole[] = ['admin', 'creator', 'moderator'];

function rolePillClass(role: UserRole) {
  switch (role) {
    case 'admin':
      return 'p-pub';
    case 'creator':
      return 'p-draft';
    case 'moderator':
      return 'p-rev';
    default:
      return '';
  }
}

function formatWhen(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function RolesPage() {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('creator');

  const teamQuery = useQuery({
    queryKey: ['admin', 'team'],
    queryFn: listTeamMembers,
    enabled: isAdmin,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const email = inviteEmail.trim();
      if (!email) {
        throw new Error('Email is required');
      }
      return inviteTeamMember({ email, role: inviteRole });
    },
    onSuccess: (result) => {
      if (result.kind === 'existing') {
        showToast('Existing user added to team');
      } else if (result.emailSent) {
        showToast('Invite email sent');
      } else if (result.signupUrl) {
        showToast(`Invite created — copy link from console in dev`);
        console.info('[team-invite]', result.signupUrl);
      } else {
        showToast('Invite created');
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
      setInviteEmail('');
    },
    onError: (err: Error) => showToast(err.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => updateTeamMemberRole(id, role),
    onSuccess: () => {
      showToast('Role updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeTeamMember(id),
    onSuccess: () => {
      showToast('Removed from team');
      queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  const rows = useMemo(() => {
    return (teamQuery.data?.items ?? []).map((row) => ({
      ...row,
      id: row.id,
    }));
  }, [teamQuery.data?.items]);

  if (!isAdmin) {
    return (
      <div className="panel">
        <h2>Roles & access</h2>
        <p className="page-sub">Only admins can manage team roles.</p>
      </div>
    );
  }

  return (
    <div className="roles-page">
      <div className="panel roles-invite">
        <h3>Invite teammate</h3>
        <p className="page-sub">Send a signup link for new accounts or upgrade an existing user immediately.</p>
        <div className="roles-invite-form">
          <FormField id="invite-email" label="Email">
            <input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="creator@sopaan.dev"
            />
          </FormField>
          <FormField id="invite-role" label="Role">
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
            >
              {TEAM_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </FormField>
          <ActionButton
            variant="gold"
            onClick={() => inviteMutation.mutate()}
            disabled={inviteMutation.isPending}
          >
            {inviteMutation.isPending ? 'Sending…' : 'Send invite'}
          </ActionButton>
        </div>
      </div>

      <div className="panel">
        <h3>Team</h3>
        <p className="page-sub">
          Owner account ({teamQuery.data?.ownerEmail ?? 'seed admin'}) is locked. Role changes apply on the next
          request.
        </p>
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (row: TeamMember) => row.name ?? '—',
            },
            {
              key: 'email',
              header: 'Email',
              render: (row: TeamMember) => row.email ?? '—',
            },
            {
              key: 'role',
              header: 'Role',
              render: (row: TeamMember) => (
                <span className={`pill ${rolePillClass(row.role)}`}>{row.role}</span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row: TeamMember) => (
                <span className={`pill ${row.status === 'pending' ? 'p-draft' : 'p-pub'}`}>{row.status}</span>
              ),
            },
            {
              key: 'joined',
              header: 'Joined / expires',
              render: (row: TeamMember) =>
                row.status === 'pending' ? formatWhen(row.expiresAt) : formatWhen(row.joinedAt),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row: TeamMember) => {
                if (row.isOwner) {
                  return <span className="roles-locked">Owner (locked)</span>;
                }

                if (row.type === 'invite') {
                  return (
                    <ActionButton
                      variant="ghost"
                      onClick={() => removeMutation.mutate(row.id)}
                      disabled={removeMutation.isPending}
                    >
                      Revoke
                    </ActionButton>
                  );
                }

                const isSelf = row.id === user?.id;

                return (
                  <div className="roles-actions">
                    <select
                      aria-label={`Change role for ${row.email}`}
                      value={row.role}
                      disabled={roleMutation.isPending || isSelf}
                      onChange={(e) =>
                        roleMutation.mutate({ id: row.id, role: e.target.value as UserRole })
                      }
                    >
                      {TEAM_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <ActionButton
                      variant="ghost"
                      onClick={() => removeMutation.mutate(row.id)}
                      disabled={removeMutation.isPending || isSelf}
                    >
                      Remove
                    </ActionButton>
                  </div>
                );
              },
            },
          ]}
          rows={rows}
          emptyMessage="No team members yet"
        />
      </div>
    </div>
  );
}
