import mongoose from 'mongoose';
import { publishableFields } from './publishableFields.js';

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    durationSec: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    materialUrl: {
      type: String,
      trim: true,
    },
    materialName: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    examTags: {
      type: [String],
      default: [],
    },
    isFree: {
      type: Boolean,
      default: true,
    },
    lessons: {
      type: [lessonSchema],
      default: [],
    },
    thumbnailColor: {
      type: String,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    ...publishableFields,
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ language: 1 });
courseSchema.index({ subject: 1 });
courseSchema.index({ examTags: 1 });
courseSchema.index({ isFree: 1 });
courseSchema.index({ status: 1, updatedAt: -1 });
courseSchema.index({ title: 'text' });

export const Course = mongoose.model('Course', courseSchema);
