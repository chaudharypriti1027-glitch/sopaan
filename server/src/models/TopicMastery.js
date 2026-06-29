import mongoose from 'mongoose';

const topicMasterySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 800,
      max: 2400,
      default: 1500,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSeen: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

topicMasterySchema.index({ userId: 1, subject: 1, topic: 1 }, { unique: true });
topicMasterySchema.index({ userId: 1, subject: 1 });

export const TopicMastery = mongoose.model('TopicMastery', topicMasterySchema);
