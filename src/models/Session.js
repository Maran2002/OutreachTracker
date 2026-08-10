import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const SessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    userRole: { type: String, enum: ['user', 'admin'], required: true },
    sessionTokenHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    lastActivityAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: false }
);

// TTL index: MongoDB will auto-delete expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1 });
SessionSchema.index({ sessionTokenHash: 1 });

const Session = models.Session || model('Session', SessionSchema);
export default Session;
