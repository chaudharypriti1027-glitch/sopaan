import mongoose from 'mongoose';
import { publishableFields } from './publishableFields.js';

const currentAffairDigestSchema = new mongoose.Schema(
  {
    digestDate: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    affairs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CurrentAffair',
      },
    ],
    itemCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notificationSentAt: {
      type: Date,
    },
    ...publishableFields,
  },
  {
    timestamps: true,
  },
);

currentAffairDigestSchema.index({ digestDate: 1 }, { unique: true });
currentAffairDigestSchema.index({ status: 1, digestDate: -1 });

export const CurrentAffairDigest = mongoose.model('CurrentAffairDigest', currentAffairDigestSchema);
