import crypto from 'crypto';
import { User } from '../../models/User.js';
import { TeamInvite } from '../../models/TeamInvite.js';
import { AppError } from '../../utils/AppError.js';
import { normalizeUserRole } from '../../constants/userRoles.js';
import { getSeedAdminUser } from '../../seed/adminConfig.js';
import { buildTeamInviteSignupUrl, sendTeamInviteEmail } from './teamInviteEmail.js';
import { bustAuthUserCache } from '../../middleware/optionalAuth.js';

export const TEAM_ROLES = ['admin', 'creator', 'moderator'];
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeEmail(email) {
  return email?.trim().toLowerCase();
}

export function isTeamOwner(user) {
  const ownerEmail = getSeedAdminUser().email;
  return normalizeEmail(user?.email) === ownerEmail;
}

function formatMember(user) {
  return {
    id: user._id.toString(),
    type: 'member',
    name: user.name,
    email: user.email ?? null,
    role: normalizeUserRole(user.role),
    status: 'active',
    isOwner: isTeamOwner(user),
    joinedAt: user.createdAt,
  };
}

function formatInvite(invite) {
  return {
    id: invite._id.toString(),
    type: 'invite',
    name: null,
    email: invite.email,
    role: invite.role,
    status: 'pending',
    isOwner: false,
    invitedAt: invite.createdAt,
    expiresAt: invite.expiresAt,
  };
}

export async function listTeamMembers() {
  const [users, invites] = await Promise.all([
    User.find({ role: { $in: TEAM_ROLES } })
      .sort({ role: 1, name: 1 })
      .select('name email role createdAt')
      .lean(),
    TeamInvite.find({ status: 'pending', expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .select('email role createdAt expiresAt')
      .lean(),
  ]);

  const inviteEmails = new Set(invites.map((row) => row.email));
  const members = users
    .filter((user) => !inviteEmails.has(normalizeEmail(user.email)))
    .map(formatMember);
  const pending = invites.map(formatInvite);

  return {
    items: [...members, ...pending],
    ownerEmail: getSeedAdminUser().email,
  };
}

async function revokePendingInviteForEmail(email) {
  await TeamInvite.updateMany(
    { email, status: 'pending' },
    { $set: { status: 'revoked' } },
  );
}

export async function inviteTeamMember({ email, role, invitedBy }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = normalizeUserRole(role);

  if (!TEAM_ROLES.includes(normalizedRole)) {
    throw new AppError('Invalid team role', 400, 'VALIDATION_ERROR');
  }

  const inviter = await User.findById(invitedBy).select('name email role').lean();
  if (!inviter || !TEAM_ROLES.includes(normalizeUserRole(inviter.role))) {
    throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
  }

  const existing = await User.findOne({ email: normalizedEmail }).select('name email role').lean();

  if (existing) {
    if (isTeamOwner(existing)) {
      throw new AppError('Cannot change the owner account via invite', 409, 'CONFLICT');
    }

    if (TEAM_ROLES.includes(normalizeUserRole(existing.role)) && existing.role === normalizedRole) {
      throw new AppError('User already has this team role', 409, 'CONFLICT');
    }

    await User.updateOne({ _id: existing._id }, { $set: { role: normalizedRole } });
    bustAuthUserCache(existing._id);
    await revokePendingInviteForEmail(normalizedEmail);

    const updated = await User.findById(existing._id).select('name email role createdAt').lean();
    return {
      kind: 'existing',
      member: formatMember(updated),
      emailSent: false,
    };
  }

  await revokePendingInviteForEmail(normalizedEmail);

  const token = crypto.randomBytes(32).toString('hex');
  const invite = await TeamInvite.create({
    email: normalizedEmail,
    role: normalizedRole,
    token,
    invitedBy,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    status: 'pending',
  });

  const signupUrl = buildTeamInviteSignupUrl(token);
  const emailResult = await sendTeamInviteEmail({
    to: normalizedEmail,
    role: normalizedRole,
    signupUrl,
    invitedByName: inviter.name,
  });

  return {
    kind: 'invited',
    invite: formatInvite(invite),
    signupUrl: emailResult.signupUrl,
    emailSent: emailResult.sent,
  };
}

export async function updateTeamMemberRole({ memberId, role, actorId }) {
  const normalizedRole = normalizeUserRole(role);

  if (!TEAM_ROLES.includes(normalizedRole)) {
    throw new AppError('Invalid team role', 400, 'VALIDATION_ERROR');
  }

  const member = await User.findById(memberId).select('name email role createdAt').lean();
  if (!member || !TEAM_ROLES.includes(normalizeUserRole(member.role))) {
    throw new AppError('Team member not found', 404, 'NOT_FOUND');
  }

  if (isTeamOwner(member)) {
    throw new AppError('Owner role cannot be changed', 403, 'FORBIDDEN');
  }

  if (String(member._id) === String(actorId) && normalizedRole !== 'admin') {
    throw new AppError('You cannot demote your own admin access', 403, 'FORBIDDEN');
  }

  await User.updateOne({ _id: member._id }, { $set: { role: normalizedRole } });
  bustAuthUserCache(member._id);

  const updated = await User.findById(member._id).select('name email role createdAt').lean();
  return formatMember(updated);
}

export async function removeTeamMember({ memberId, actorId }) {
  const invite = await TeamInvite.findOne({
    _id: memberId,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  }).lean();

  if (invite) {
    await TeamInvite.updateOne({ _id: invite._id }, { $set: { status: 'revoked' } });
    return { removed: true, kind: 'invite', id: invite._id.toString() };
  }

  const member = await User.findById(memberId).select('name email role').lean();
  if (!member || !TEAM_ROLES.includes(normalizeUserRole(member.role))) {
    throw new AppError('Team member not found', 404, 'NOT_FOUND');
  }

  if (isTeamOwner(member)) {
    throw new AppError('Owner cannot be removed', 403, 'FORBIDDEN');
  }

  if (String(member._id) === String(actorId)) {
    throw new AppError('You cannot remove yourself from the team', 403, 'FORBIDDEN');
  }

  await User.updateOne({ _id: member._id }, { $set: { role: 'student' } });
  bustAuthUserCache(member._id);
  await revokePendingInviteForEmail(normalizeEmail(member.email));

  return { removed: true, kind: 'member', id: member._id.toString() };
}

export async function getTeamInviteByToken(token) {
  const invite = await TeamInvite.findOne({ token, status: 'pending' }).lean();
  if (!invite) {
    throw new AppError('Invite not found or already used', 404, 'NOT_FOUND');
  }

  if (invite.expiresAt <= new Date()) {
    throw new AppError('Invite has expired', 410, 'INVITE_EXPIRED');
  }

  return {
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
  };
}

export async function acceptTeamInviteOnSignup({ inviteToken, userId, email }) {
  if (!inviteToken) {
    return null;
  }

  const invite = await TeamInvite.findOne({ token: inviteToken, status: 'pending' });
  if (!invite) {
    throw new AppError('Invite not found or already used', 400, 'INVALID_INVITE');
  }

  if (invite.expiresAt <= new Date()) {
    throw new AppError('Invite has expired', 410, 'INVITE_EXPIRED');
  }

  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail !== invite.email) {
    throw new AppError('Email must match the invite', 400, 'INVALID_INVITE');
  }

  await User.updateOne({ _id: userId }, { $set: { role: invite.role } });
  bustAuthUserCache(userId);
  invite.status = 'accepted';
  invite.acceptedAt = new Date();
  invite.acceptedUserId = userId;
  await invite.save();

  return invite.role;
}
