import mongoose from 'mongoose';

const experimentAssignmentSchema = new mongoose.Schema(
  {
    installId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignments: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

export const ExperimentAssignment = mongoose.model(
  'ExperimentAssignment',
  experimentAssignmentSchema,
);
