import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const ReminderSettingsSchema = new Schema(
  {
    intervalDays: { type: Number, default: 3, min: 1, max: 30 },
    maxReminders: { type: Number, default: 2, min: 1, max: 10 },
    reminderTime: { type: String, default: '10:00' },
    timezone: { type: String, default: 'UTC' },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    passwordHash: { type: String, select: false },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, sparse: true },
    avatar: { type: String },
    role: { type: String, enum: ['user'], default: 'user' },
    status: { type: String, enum: ['active', 'inactive', 'closed'], default: 'active' },
    reminderSettings: { type: ReminderSettingsSchema, default: () => ({}) },
    lastLoginAt: { type: Date },
    closedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Explicit indexes
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

const User = models.User || model('User', UserSchema);
export default User;
