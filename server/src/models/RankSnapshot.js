import mongoose from 'mongoose';

const rankSnapshotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    air: {
      type: Number,
      min: 1,
    },
    percentile: {
      type: Number,
      min: 0,
      max: 100,
    },
    weekAir: {
      type: Number,
      min: 1,
    },
    takenAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

rankSnapshotSchema.index({ user: 1, takenAt: -1 });

export const RankSnapshot = mongoose.model('RankSnapshot', rankSnapshotSchema);
