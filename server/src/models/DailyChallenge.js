import mongoose from 'mongoose';
import { publishableFields } from './publishableFields.js';

const dailyChallengeSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    qCount: {
      type: Number,
      required: true,
      min: 1,
    },
    rewardCoins: {
      type: Number,
      default: 10,
      min: 0,
    },
    examTag: {
      type: String,
      trim: true,
    },
    ...publishableFields,
  },
  {
    timestamps: true,
  }
);

dailyChallengeSchema.index({ date: 1, examTag: 1 }, { unique: true, sparse: true });

export const DailyChallenge = mongoose.model('DailyChallenge', dailyChallengeSchema);
