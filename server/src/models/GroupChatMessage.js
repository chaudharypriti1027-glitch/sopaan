import mongoose from 'mongoose';

const groupChatMessageSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
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

groupChatMessageSchema.index({ groupId: 1, createdAt: -1 });
// Privacy export / account erasure look up messages by author.
groupChatMessageSchema.index({ userId: 1 });

export const GroupChatMessage = mongoose.model('GroupChatMessage', groupChatMessageSchema);
