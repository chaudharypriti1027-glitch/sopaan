import mongoose from 'mongoose';

const jobRunSchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    runKey: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      required: true,
      default: 'running',
    },
    attempt: {
      type: Number,
      default: 1,
      min: 1,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
    },
    error: {
      type: String,
      trim: true,
    },
    triggeredBy: {
      type: String,
      enum: ['scheduler', 'manual', 'bullmq'],
      default: 'scheduler',
    },
  },
  {
    timestamps: true,
  },
);

jobRunSchema.index({ jobName: 1, runKey: 1 }, { unique: true });
jobRunSchema.index({ createdAt: -1 });
jobRunSchema.index({ status: 1, startedAt: -1 });

export const JobRun = mongoose.model('JobRun', jobRunSchema);
