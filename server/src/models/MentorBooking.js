import mongoose from 'mongoose';

const mentorBookingSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    slotStart: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['booked', 'done', 'cancelled'],
      default: 'booked',
    },
  },
  {
    timestamps: true,
  }
);

mentorBookingSchema.index({ mentorId: 1, slotStart: 1 });
mentorBookingSchema.index({ studentId: 1, status: 1 });
mentorBookingSchema.index({ status: 1, slotStart: 1 });

export const MentorBooking = mongoose.model('MentorBooking', mentorBookingSchema);
