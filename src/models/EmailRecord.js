import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const EmailRecordSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 255,
    },
    position: { type: String, required: true, trim: true, maxlength: 200 },
    companyName: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

// Indexes for efficient querying & sorting
EmailRecordSchema.index({ userId: 1, createdAt: -1 });
EmailRecordSchema.index({ createdAt: -1 });

// Text index for search functionality
EmailRecordSchema.index(
  {
    name: 'text',
    email: 'text',
    position: 'text',
    companyName: 'text',
  },
  { name: 'email_record_text_search' }
);

const EmailRecord = models.EmailRecord || model('EmailRecord', EmailRecordSchema);
export default EmailRecord;
