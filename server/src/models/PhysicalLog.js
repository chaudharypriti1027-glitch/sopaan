import mongoose from 'mongoose';

const physicalLogSchema = new mongoose.Schema(
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
    testType: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

physicalLogSchema.index({ userId: 1, date: -1 });
physicalLogSchema.index({ userId: 1, testType: 1, date: -1 });

export const PhysicalLog = mongoose.model('PhysicalLog', physicalLogSchema);
