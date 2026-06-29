import mongoose from 'mongoose';

const aiDoubtCacheSchema = new mongoose.Schema(
  {
    queryText: {
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    embedding: {
      type: [Number],
      default: undefined,
    },
    embeddingModel: {
      type: String,
      trim: true,
    },
    hitCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

aiDoubtCacheSchema.index({ queryText: 'text' });
aiDoubtCacheSchema.index({ language: 1, createdAt: -1 });
aiDoubtCacheSchema.index({ queryText: 1, language: 1 });

export const AiDoubtCache = mongoose.model('AiDoubtCache', aiDoubtCacheSchema);

/**
 * Atlas Vector Search index definition (create in Atlas UI or CLI):
 * {
 *   "name": "ai_doubt_embeddings",
 *   "type": "vectorSearch",
 *   "fields": [
 *     { "type": "vector", "path": "embedding", "numDimensions": 512, "similarity": "cosine" },
 *     { "type": "filter", "path": "language" }
 *   ]
 * }
 */
