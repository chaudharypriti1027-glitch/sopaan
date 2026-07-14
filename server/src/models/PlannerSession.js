import mongoose from 'mongoose';

const plannerSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    durationMin: {
      type: Number,
      required: true,
      min: 1,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    motivation: {
      type: String,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    actionType: {
      type: String,
      trim: true,
      default: null,
    },
    actionResourceId: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

plannerSessionSchema.index({ userId: 1, date: 1 });
plannerSessionSchema.index({ userId: 1, date: 1, startTime: 1 });
plannerSessionSchema.index({ userId: 1, completed: 1 });

export const PlannerSession = mongoose.model('PlannerSession', plannerSessionSchema);
