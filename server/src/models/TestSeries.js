import mongoose from 'mongoose';

const mockSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    unlockDate: {
      type: Date,
      required: true,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const testSeriesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    examTag: {
      type: String,
      required: true,
      trim: true,
    },
    mocks: {
      type: [mockSchema],
      default: [],
    },
    enrolledUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

testSeriesSchema.index({ examTag: 1 });
testSeriesSchema.index({ enrolledUsers: 1 });
testSeriesSchema.index({ title: 'text' });

export const TestSeries = mongoose.model('TestSeries', testSeriesSchema);
