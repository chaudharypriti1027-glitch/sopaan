import mongoose from 'mongoose';

const chatReportSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      required: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupChatMessage',
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

chatReportSchema.index({ status: 1, createdAt: -1 });
chatReportSchema.index({ messageId: 1, reportedBy: 1 }, { unique: true });

export const ChatReport = mongoose.model('ChatReport', chatReportSchema);
