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
    educatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    instructor: {
      type: String,
      trim: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    exam: {
      type: String,
      trim: true,
    },
    examTag: {
      type: String,
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    startsAt: {
      type: Date,
    },
    scheduledAt: {
      type: Date,
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
    coverUrl: {
      type: String,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled',
    },
    roomName: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    streamingRoomId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    streamingProvider: {
      type: String,
      trim: true,
    },
    autoRecord: {
      type: Boolean,
      default: false,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    viewersPeak: {
      type: Number,
      default: 0,
      min: 0,
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
    recordingPublished: {
      type: Boolean,
      default: false,
    },
    recordingDurationSec: {
      type: Number,
      min: 0,
    },
    egressId: {
      type: String,
      trim: true,
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

liveClassSchema.pre('validate', function syncLegacyFields() {
  if (this.educatorId && !this.instructorId) {
    this.instructorId = this.educatorId;
  } else if (this.instructorId && !this.educatorId) {
    this.educatorId = this.instructorId;
  }

  if (this.exam && !this.examTag) {
    this.examTag = this.exam;
  } else if (this.examTag && !this.exam) {
    this.exam = this.examTag;
  }

  if (this.startsAt && !this.scheduledAt) {
    this.scheduledAt = this.startsAt;
  } else if (this.scheduledAt && !this.startsAt) {
    this.startsAt = this.scheduledAt;
  }

  if (this.roomName && !this.streamingRoomId) {
    this.streamingRoomId = this.roomName;
  } else if (this.streamingRoomId && !this.roomName) {
    this.roomName = this.streamingRoomId;
  }

  if (this.coverUrl && !this.thumbnailUrl) {
    this.thumbnailUrl = this.coverUrl;
  } else if (this.thumbnailUrl && !this.coverUrl) {
    this.coverUrl = this.thumbnailUrl;
  }

  if (this.egressId && !this.livekitEgressId) {
    this.livekitEgressId = this.egressId;
  } else if (this.livekitEgressId && !this.egressId) {
    this.egressId = this.livekitEgressId;
  }
});

liveClassSchema.index({ status: 1, startsAt: 1 });
liveClassSchema.index({ status: 1, scheduledAt: 1 });
liveClassSchema.index({ status: 1, recordingPublished: 1, endedAt: -1 });
liveClassSchema.index({ egressId: 1 }, { sparse: true });
liveClassSchema.index({ startsAt: -1 });
liveClassSchema.index({ scheduledAt: -1 });

export const LiveClass = mongoose.model('LiveClass', liveClassSchema);
