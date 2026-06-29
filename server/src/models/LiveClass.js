import mongoose from 'mongoose';

const liveClassSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    instructor: {
      type: String,
      required: true,
      trim: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    examTag: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    durationMin: {
      type: Number,
      required: true,
      min: 15,
      max: 240,
    },
    thumbnailColor: {
      type: String,
      trim: true,
      default: '#4F46E5',
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled',
    },
    streamingRoomId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    streamingProvider: {
      type: String,
      trim: true,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    attendeeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recordingUrl: {
      type: String,
      trim: true,
    },
    recordingStatus: {
      type: String,
      enum: ['pending', 'ready', 'failed'],
    },
    livekitEgressId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

liveClassSchema.index({ status: 1, scheduledAt: 1 });
liveClassSchema.index({ scheduledAt: -1 });

export const LiveClass = mongoose.model('LiveClass', liveClassSchema);
