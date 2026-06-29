import mongoose from 'mongoose';
import { CONVERSION_EVENTS } from '../config/experimentsConfig.js';

const experimentEventSchema = new mongoose.Schema(
  {
    installId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    event: {
      type: String,
      required: true,
      enum: CONVERSION_EVENTS,
      index: true,
    },
    experiments: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

experimentEventSchema.index({ event: 1, createdAt: -1 });
experimentEventSchema.index({ 'experiments.onboarding_variant': 1, event: 1 });

export const ExperimentEvent = mongoose.model('ExperimentEvent', experimentEventSchema);
