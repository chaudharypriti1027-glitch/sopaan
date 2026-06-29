import mongoose from 'mongoose';

const aiDoubtAnswerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    imageAttached: {
      type: Boolean,
      default: false,
    },
    fromCache: {
      type: Boolean,
      default: false,
    },
    cacheSource: {
      type: String,
      enum: ['ai_cache', 'forum_doubt', 'exact_cache', 'user_history', null],
      default: null,
    },
    responseMs: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

aiDoubtAnswerSchema.index({ userId: 1, createdAt: -1 });
aiDoubtAnswerSchema.index({ userId: 1, question: 1, language: 1 }, { unique: true });

export const AiDoubtAnswer = mongoose.model('AiDoubtAnswer', aiDoubtAnswerSchema);
