import mongoose from 'mongoose';
import { publishableFields } from './publishableFields.js';

const eligibilitySchema = new mongoose.Schema(
  {
    ageMin: {
      type: Number,
      min: 0,
    },
    ageMax: {
      type: Number,
      min: 0,
    },
    education: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const stageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const importantDateSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['open', 'apply', 'exam', 'result', 'admit', 'other'],
      required: true,
    },
  },
  { _id: false }
);

const cutoffSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    category: {
      type: String,
      enum: ['GEN', 'OBC', 'SC', 'ST', 'EWS'],
      required: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const recommendedBookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
    link: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'SSC',
        'Banking',
        'Railways',
        'UPSC',
        'StatePSC',
        'Police',
        'Defence',
        'Teaching',
        'Other',
      ],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    eligibility: {
      type: eligibilitySchema,
      default: () => ({}),
    },
    stages: {
      type: [stageSchema],
      default: [],
    },
    importantDates: {
      type: [importantDateSchema],
      default: [],
    },
    vacancies: {
      type: Number,
      min: 0,
    },
    cutoffs: {
      type: [cutoffSchema],
      default: [],
    },
    recommendedBooks: {
      type: [recommendedBookSchema],
      default: [],
    },
    ...publishableFields,
  },
  {
    timestamps: true,
  }
);

examSchema.index({ category: 1 });
examSchema.index({ status: 1, updatedAt: -1 });
examSchema.index({ name: 'text', description: 'text' });
examSchema.index({ 'importantDates.date': 1 });

export const Exam = mongoose.model('Exam', examSchema);
