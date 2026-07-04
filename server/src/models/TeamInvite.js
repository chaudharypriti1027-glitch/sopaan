import mongoose from 'mongoose';

const TEAM_INVITE_ROLES = ['admin', 'creator', 'moderator'];

const teamInviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    role: {
      type: String,
      enum: TEAM_INVITE_ROLES,
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked'],
      default: 'pending',
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    acceptedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

teamInviteSchema.index(
  { email: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);

export const TeamInvite = mongoose.model('TeamInvite', teamInviteSchema);
export const TEAM_INVITE_ROLES_EXPORT = TEAM_INVITE_ROLES;
