import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const AdminSchema = new Schema(
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
    passwordHash: { type: String, required: true, select: false },
    permissions: {
      type: [String],
      default: [],
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    avatar: { type: String },
    lastLoginAt: { type: Date },
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

AdminSchema.index({ email: 1 }, { unique: true });
AdminSchema.index({ status: 1 });
AdminSchema.index({ createdAt: -1 });

const Admin = models.Admin || model('Admin', AdminSchema);
export default Admin;
