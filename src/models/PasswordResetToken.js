import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const PasswordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// TTL: auto-delete expired tokens
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PasswordResetTokenSchema.index({ tokenHash: 1 });
PasswordResetTokenSchema.index({ userId: 1 });

const PasswordResetToken =
  models.PasswordResetToken || model('PasswordResetToken', PasswordResetTokenSchema);

export default PasswordResetToken;
