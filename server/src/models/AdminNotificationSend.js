import mongoose from 'mongoose';

const adminNotificationSendSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: String,
      enum: ['all', 'active30d', 'pro', 'free', 'byExam'],
      required: true,
    },
    exam: {
      type: String,
      trim: true,
    },
    sendAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'sending', 'sent', 'failed', 'cancelled'],
      default: 'scheduled',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    bullJobId: {
      type: String,
      trim: true,
    },
    stats: {
      targeted: { type: Number, default: 0, min: 0 },
      inApp: { type: Number, default: 0, min: 0 },
      delivered: { type: Number, default: 0, min: 0 },
      opened: { type: Number, default: 0, min: 0 },
      skipped: { type: Number, default: 0, min: 0 },
    },
    sentAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

adminNotificationSendSchema.index({ status: 1, sendAt: 1 });
adminNotificationSendSchema.index({ createdAt: -1 });

export const AdminNotificationSend = mongoose.model(
  'AdminNotificationSend',
  adminNotificationSendSchema,
);
