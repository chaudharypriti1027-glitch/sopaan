import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['lesson', 'test', 'video'],
      required: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    progressPct: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    accent: {
      type: String,
      enum: ['primary', 'teal', 'gold', 'coral'],
      default: 'primary',
    },
    deeplink: {
      type: String,
      required: true,
      trim: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

progressSchema.index({ user: 1, updatedAt: -1 });
progressSchema.index({ user: 1, kind: 1, refId: 1 }, { unique: true });

export const Progress = mongoose.model('Progress', progressSchema);
