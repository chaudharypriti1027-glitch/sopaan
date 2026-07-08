import mongoose from 'mongoose';

const otpTokenSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
      sparse: true,
    },
    codeHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/** MongoDB TTL — documents removed when expiresAt passes. */
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpTokenSchema.index({ phone: 1, expiresAt: -1 });
otpTokenSchema.index({ email: 1, expiresAt: -1 });

export const OtpToken = mongoose.model('OtpToken', otpTokenSchema);
