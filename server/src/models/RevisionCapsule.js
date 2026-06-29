import mongoose from 'mongoose';

const revisionCapsuleSchema = new mongoose.Schema(
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
    readMinutes: {
      type: Number,
      min: 1,
    },
    body: {
      type: String,
      required: true,
    },
    bookmarkable: {
      type: Boolean,
      default: true,
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

revisionCapsuleSchema.index({ language: 1 });
revisionCapsuleSchema.index({ subject: 1 });
revisionCapsuleSchema.index({ bookmarkable: 1 });
revisionCapsuleSchema.index({ title: 'text', body: 'text' });

export const RevisionCapsule = mongoose.model('RevisionCapsule', revisionCapsuleSchema);
