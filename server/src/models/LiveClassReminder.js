import mongoose from 'mongoose';

const liveClassReminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    liveClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveClass',
      required: true,
    },
    remindAt: {
      type: Date,
      required: true,
    },
    notified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

liveClassReminderSchema.index({ userId: 1, liveClassId: 1 }, { unique: true });
liveClassReminderSchema.index({ remindAt: 1, notified: 1 });

export const LiveClassReminder = mongoose.model('LiveClassReminder', liveClassReminderSchema);
