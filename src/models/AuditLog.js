import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const AuditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, required: true },
    actorType: { type: String, enum: ['user', 'admin'], required: true },
    action: { type: String, required: true, maxlength: 100 },
    resourceType: { type: String, required: true, maxlength: 100 },
    resourceId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

AuditLogSchema.index({ actorId: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ timestamp: -1 });

const AuditLog = models.AuditLog || model('AuditLog', AuditLogSchema);
export default AuditLog;
