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
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      trim: true,
    },
    expertise: {
      type: [String],
      default: [],
    },
    rate: {
      type: Number,
      min: 0,
      default: null,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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
mentorSchema.index({ isActive: 1, rating: -1 });

mentorSchema.pre('validate', function validateMentorIdentity() {
  if (!this.userId && !this.name?.trim()) {
    this.invalidate('name', 'Name is required when no user account is linked');
  }
});

export const Mentor = mongoose.model('Mentor', mentorSchema);
