import mongoose from 'mongoose';

const doubtAnswerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    votes: {
      type: Number,
      default: 0,
      min: 0,
    },
    voterIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const doubtPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    votes: {
      type: Number,
      default: 0,
      min: 0,
    },
    voterIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    answers: {
      type: [doubtAnswerSchema],
      default: [],
    },
    embedding: {
      type: [Number],
      default: undefined,
    },
    embeddingModel: {
      type: String,
      trim: true,
    },
    bestAnswer: {
      type: String,
      trim: true,
    },
    hasAnswer: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

doubtPostSchema.index({ userId: 1, createdAt: -1 });
doubtPostSchema.index({ subject: 1, createdAt: -1 });
doubtPostSchema.index({ votes: -1 });
doubtPostSchema.index({ title: 'text', body: 'text' });

/**
 * Atlas Vector Search index (create in Atlas UI):
 * name: doubt_post_embeddings
 * fields: vector path "embedding" (512 dims, cosine), filters: language, hasAnswer
 */

export const DoubtPost = mongoose.model('DoubtPost', doubtPostSchema);
