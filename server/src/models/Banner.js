import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280,
    },
    linkType: {
      type: String,
      enum: ['premium', 'test_series', 'current_affairs', 'live_classes', 'readiness', 'quiz', 'deeplink'],
      required: true,
    },
    linkRef: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

bannerSchema.index({ active: 1, updatedAt: -1 });

export const Banner = mongoose.model('Banner', bannerSchema);
