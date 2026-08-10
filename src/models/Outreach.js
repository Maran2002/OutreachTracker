import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const OutreachSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    outreachType: {
      type: String,
      required: true,
      enum: ['cold_email', 'warm_intro', 'linkedin_dm', 'cto_email'],
    },
    company: { type: String, required: true, trim: true, maxlength: 200 },
    contactName: { type: String, required: true, trim: true, maxlength: 200 },
    contactRole: { type: String, trim: true, maxlength: 200 },
    contactUrl: { type: String, trim: true, maxlength: 500 },
    method: {
      type: String,
      required: true,
      enum: ['email', 'linkedin', 'twitter_dm', 'referral'],
    },
    subjectMessage: { type: String, maxlength: 2000 },
    status: {
      type: String,
      required: true,
      enum: ['sent', 'no_response', 'replied', 'screening_call', 'interview', 'rejected'],
      default: 'sent',
    },
    response: { type: String, maxlength: 2000 },
    interviewScheduled: { type: Boolean, default: false },
    nextAction: { type: String, maxlength: 500 },
    followUpDate: { type: Date },
    notes: { type: String, maxlength: 3000 },
    reminderCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Compound indexes for efficient user-scoped queries
OutreachSchema.index({ userId: 1, date: -1 });
OutreachSchema.index({ userId: 1, status: 1, date: -1 });
OutreachSchema.index({ userId: 1, followUpDate: 1 });
OutreachSchema.index({ userId: 1, outreachType: 1 });
OutreachSchema.index({ userId: 1, method: 1 });

// Text index for full-text search
OutreachSchema.index(
  {
    company: 'text',
    contactName: 'text',
    contactRole: 'text',
    contactUrl: 'text',
    subjectMessage: 'text',
    response: 'text',
    notes: 'text',
  },
  { name: 'outreach_text_search' }
);

const Outreach = models.Outreach || model('Outreach', OutreachSchema);
export default Outreach;
