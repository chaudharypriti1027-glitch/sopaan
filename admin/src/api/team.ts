import { apiRequest } from './client';
import type { UserRole } from './types';

export type TeamMemberStatus = 'active' | 'pending';

export interface TeamMember {
  id: string;
  type: 'member' | 'invite';
  name: string | null;
  email: string | null;
  role: UserRole;
  status: TeamMemberStatus;
  isOwner: boolean;
  joinedAt?: string;
  invitedAt?: string;
  expiresAt?: string;
}

export interface TeamListResponse {
  items: TeamMember[];
  ownerEmail: string;
}

export interface TeamInviteResult {
  kind: 'existing' | 'invited';
  member?: TeamMember;
  invite?: TeamMember;
  signupUrl?: string;
  emailSent?: boolean;
}

export function listTeamMembers() {
  return apiRequest<TeamListResponse>('/api/admin/team');
}

export function inviteTeamMember(payload: { email: string; role: UserRole }) {
  return apiRequest<TeamInviteResult>('/api/admin/team/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTeamMemberRole(id: string, role: UserRole) {
  return apiRequest<TeamMember>(`/api/admin/team/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function removeTeamMember(id: string) {
  return apiRequest<{ removed: boolean; kind: 'member' | 'invite'; id: string }>(
    `/api/admin/team/${id}`,
    { method: 'DELETE' },
  );
}

export interface TeamInvitePreview {
  email: string;
  role: UserRole;
  expiresAt: string;
}

export function fetchTeamInvite(token: string) {
  return apiRequest<TeamInvitePreview>(`/api/auth/team-invite/${encodeURIComponent(token)}`, undefined, {
    retryOn401: false,
  });
}

export function acceptTeamInviteSignup(payload: {
  name: string;
  email: string;
  password: string;
  inviteToken: string;
}) {
  return apiRequest<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; name: string; email?: string; role: UserRole };
  }>(
    '/api/auth/signup',
    {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        inviteToken: payload.inviteToken,
        privacyConsent: {
          policyVersion: '1.0',
          aiProcessing: true,
          marketing: false,
        },
      }),
    },
    { retryOn401: false },
  );
}
