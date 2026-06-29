import mongoose from 'mongoose';
import { ratingFromDifficulty } from '../services/adaptive/rating.js';
import { publishableFields } from './publishableFields.js';

const optionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    rating: {
      type: Number,
      min: 800,
      max: 2400,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [optionSchema],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 4;
        },
        message: 'Question must have exactly 4 options',
      },
    },
    correctKey: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    explanation: {
      type: String,
      trim: true,
    },
    examTags: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      enum: ['official', 'ai', 'community'],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    embedding: {
      type: [Number],
      default: undefined,
    },
    embeddingModel: {
      type: String,
      trim: true,
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    qualityIssues: {
      type: [
        {
          code: { type: String, required: true },
          message: { type: String, required: true },
          severity: { type: String, enum: ['error', 'warning'], required: true },
          metadata: { type: Object },
        },
      ],
      default: [],
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
    duplicateScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    qualityCheckedAt: {
      type: Date,
    },
    ...publishableFields,
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ subject: 1, topic: 1, difficulty: 1 });
questionSchema.index({ subject: 1, rating: 1 });
questionSchema.index({ examTags: 1 });
questionSchema.index({ source: 1, createdBy: 1 });
questionSchema.index({ language: 1 });
questionSchema.index({ status: 1, updatedAt: -1 });
questionSchema.index({ reviewStatus: 1, updatedAt: -1 });
questionSchema.index({ duplicateOf: 1 });
questionSchema.index({ text: 'text' });

questionSchema.pre('validate', function validateCorrectKey(next) {
  const optionKeys = this.options?.map((option) => option.key) ?? [];

  if (this.correctKey && !optionKeys.includes(this.correctKey)) {
    this.invalidate('correctKey', 'correctKey must match one of the option keys');
  }

  if (this.rating == null && this.difficulty) {
    this.rating = ratingFromDifficulty(this.difficulty);
  }

  next();
});

/**
 * Atlas Vector Search index (create in Atlas UI):
 * name: question_embeddings
 * fields: vector path "embedding" (512 dims, cosine), filters: subject, language
 */
export const Question = mongoose.model('Question', questionSchema);
