import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['unlock', 'theme', 'discount', 'mentor'],
      required: true,
    },
    coinCost: {
      type: Number,
      required: true,
      min: 0,
    },
    icon: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

rewardSchema.index({ type: 1 });
rewardSchema.index({ coinCost: 1 });

export const Reward = mongoose.model('Reward', rewardSchema);
