import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const ReminderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    outreachId: { type: Schema.Types.ObjectId, ref: 'Outreach', required: true },
    reminderNumber: { type: Number, required: true, min: 1 },
    scheduledFor: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'shown', 'completed', 'dismissed'],
      default: 'pending',
    },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: false }
);

ReminderSchema.index({ userId: 1, scheduledFor: 1 });
ReminderSchema.index({ userId: 1, status: 1 });
ReminderSchema.index({ outreachId: 1 });

const Reminder = models.Reminder || model('Reminder', ReminderSchema);
export default Reminder;
