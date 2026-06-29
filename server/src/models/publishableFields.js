import mongoose from 'mongoose';

export const CONTENT_STATUSES = ['draft', 'published'];

export const publishableFields = {
  status: {
    type: String,
    enum: CONTENT_STATUSES,
    default: 'draft',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
};

/** Match published content; legacy docs without status remain visible. */
export const publishedContentFilter = {
  $or: [{ status: 'published' }, { status: { $exists: false } }],
};

export function withAuditOnCreate(data, userId) {
  return {
    ...data,
    createdBy: userId,
    updatedBy: userId,
    status: data.status ?? 'draft',
  };
}

export function withAuditOnUpdate(data, userId) {
  return {
    ...data,
    updatedBy: userId,
  };
}
