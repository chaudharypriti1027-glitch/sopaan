import mongoose from 'mongoose';

const liveClassChatMessageSchema = new mongoose.Schema(
  {
    liveClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveClass',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

liveClassChatMessageSchema.index({ liveClassId: 1, createdAt: -1 });
// Privacy export / account erasure look up messages by author.
liveClassChatMessageSchema.index({ userId: 1 });

export const LiveClassChatMessage = mongoose.model(
  'LiveClassChatMessage',
  liveClassChatMessageSchema,
);
