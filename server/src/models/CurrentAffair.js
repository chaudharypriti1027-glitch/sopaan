import mongoose from 'mongoose';
import { publishableFields } from './publishableFields.js';

const currentAffairSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    shortAnswer: {
      type: String,
      trim: true,
    },
    examTip: {
      type: String,
      trim: true,
    },
    keyPoints: [
      {
        type: String,
        trim: true,
      },
    ],
    heroMediaKey: {
      type: String,
      trim: true,
    },
    body: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    feedSourceId: {
      type: String,
      trim: true,
    },
    feedItemId: {
      type: String,
      trim: true,
    },
    digestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CurrentAffairDigest',
    },
    publishedAt: {
      type: Date,
      required: true,
    },
    imageColor: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    quizQuestions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    ...publishableFields,
  },
  {
    timestamps: true,
  }
);

currentAffairSchema.index({ publishedAt: -1 });
currentAffairSchema.index({ status: 1, publishedAt: -1 });
currentAffairSchema.index({ category: 1, publishedAt: -1 });
currentAffairSchema.index({ feedSourceId: 1, feedItemId: 1 }, { unique: true, sparse: true });
currentAffairSchema.index({ title: 'text', summary: 'text' });

export const CurrentAffair = mongoose.model('CurrentAffair', currentAffairSchema);
