import mongoose from 'mongoose';

const studyGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    examTag: {
      type: String,
      required: true,
      trim: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

studyGroupSchema.index({ examTag: 1 });
studyGroupSchema.index({ members: 1 });
studyGroupSchema.index({ createdBy: 1 });

export const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);
