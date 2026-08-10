import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const OutreachStatusHistorySchema = new Schema(
  {
    outreachId: { type: Schema.Types.ObjectId, ref: 'Outreach', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    oldStatus: {
      type: String,
      required: true,
      enum: ['sent', 'no_response', 'replied', 'screening_call', 'interview', 'rejected'],
    },
    newStatus: {
      type: String,
      required: true,
      enum: ['sent', 'no_response', 'replied', 'screening_call', 'interview', 'rejected'],
    },
    note: { type: String, maxlength: 500 },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: false }
);

OutreachStatusHistorySchema.index({ outreachId: 1, changedAt: -1 });
OutreachStatusHistorySchema.index({ userId: 1, changedAt: -1 });

const OutreachStatusHistory =
  models.OutreachStatusHistory ||
  model('OutreachStatusHistory', OutreachStatusHistorySchema);

export default OutreachStatusHistory;
