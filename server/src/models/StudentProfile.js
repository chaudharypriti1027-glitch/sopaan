import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    examTrack: {
      type: String,
      trim: true,
    },
    targetYear: {
      type: Number,
      min: 2000,
      max: 2100,
    },
  },
  { _id: false }
);

const preferencesSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      enum: ['en', 'hi', 'gu'],
      default: 'en',
    },
    dailyGoalMinutes: {
      type: Number,
      min: 0,
      max: 1440,
    },
  },
  { _id: false }
);

const COMPLETENESS_CHECKS = [
  (profile) => Boolean(profile.education),
  (profile) => Boolean(profile.category),
  (profile) => Boolean(profile.state),
  (profile) => profile.attemptNumber != null && profile.attemptNumber > 0,
  (profile) => profile.targetYear != null,
  (profile) => Boolean(profile.goal?.examTrack),
  (profile) => profile.goal?.targetYear != null,
  (profile) => Boolean(profile.preferences?.language),
  (profile) => profile.preferences?.dailyGoalMinutes != null,
];

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    education: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['GEN', 'OBC', 'SC', 'ST', 'EWS'],
    },
    state: {
      type: String,
      trim: true,
    },
    attemptNumber: {
      type: Number,
      min: 1,
    },
    targetYear: {
      type: Number,
      min: 2000,
      max: 2100,
    },
    goal: {
      type: goalSchema,
      default: () => ({}),
    },
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },
    completeness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

studentProfileSchema.index({ category: 1, state: 1 });
studentProfileSchema.index({ 'goal.examTrack': 1 });

studentProfileSchema.methods.computeCompleteness = function computeCompleteness() {
  const filledCount = COMPLETENESS_CHECKS.filter((check) => check(this)).length;
  return Math.round((filledCount / COMPLETENESS_CHECKS.length) * 100);
};

studentProfileSchema.pre('save', function updateCompleteness(next) {
  this.completeness = this.computeCompleteness();
  next();
});

export const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
