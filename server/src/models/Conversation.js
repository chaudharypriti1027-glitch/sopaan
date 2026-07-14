import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 2;
        },
        message: 'Conversation must have exactly two participants',
      },
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastMessageText: {
      type: String,
      trim: true,
      default: '',
    },
    lastMessageType: {
      type: String,
      enum: ['text', 'image', 'document'],
      default: 'text',
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({ participants: 1 }, { unique: true });
conversationSchema.index({ lastMessageAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
