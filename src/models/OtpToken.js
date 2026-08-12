import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const OtpTokenSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    pendingUserData: {
      type: Schema.Types.Mixed, // Stores { name, passwordHash } for registration flow
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// TTL index to automatically delete expired OTPs
OtpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpTokenSchema.index({ email: 1, purpose: 1 });

const OtpToken = models.OtpToken || model('OtpToken', OtpTokenSchema);

export default OtpToken;
