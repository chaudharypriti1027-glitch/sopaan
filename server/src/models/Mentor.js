import mongoose from 'mongoose';

const mentorSlotSchema = new mongoose.Schema(
  {
    start: {
      type: Date,
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const mentorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    expertise: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    sessionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bio: {
      type: String,
      trim: true,
    },
    slots: {
      type: [mentorSlotSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

mentorSchema.index({ expertise: 1 });
mentorSchema.index({ rating: -1 });
mentorSchema.index({ 'slots.start': 1 });

export const Mentor = mongoose.model('Mentor', mentorSchema);
