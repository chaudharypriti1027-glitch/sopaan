import mongoose from 'mongoose';

const focusLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    focusMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    breaksTaken: {
      type: Number,
      default: 0,
      min: 0,
    },
    sessionsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

focusLogSchema.index({ userId: 1, date: -1 }, { unique: true });

export const FocusLog = mongoose.model('FocusLog', focusLogSchema);
