import mongoose from 'mongoose';

const directMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'document'],
      default: 'text',
    },
    text: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    attachmentUrl: {
      type: String,
      trim: true,
      default: '',
    },
    attachmentName: {
      type: String,
      trim: true,
      default: '',
    },
    attachmentMimeType: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

directMessageSchema.index({ conversationId: 1, createdAt: -1 });

export const DirectMessage = mongoose.model('DirectMessage', directMessageSchema);
