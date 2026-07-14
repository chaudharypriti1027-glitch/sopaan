import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
    },
    examName: {
      type: String,
      required: true,
      trim: true,
    },
    examDate: {
      type: Date,
      required: true,
    },
    targetRank: {
      type: Number,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

goalSchema.index({ user: 1, examId: 1 });

export const Goal = mongoose.model('Goal', goalSchema);
