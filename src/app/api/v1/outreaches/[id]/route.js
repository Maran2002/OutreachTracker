export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db/mongodb';
import Outreach from '@/models/Outreach';
import OutreachStatusHistory from '@/models/OutreachStatusHistory';
import Reminder from '@/models/Reminder';
import { requireUserSession } from '@/lib/auth/session';
import { parseRequestBody, updateOutreachSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError } from '@/lib/utils';

// GET /api/v1/outreaches/[id]
export async function GET(request, { params }) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  const { id } = await params;
  await dbConnect();

  const outreach = await Outreach.findOne({ _id: id, userId: session.userId }).lean();
  if (!outreach) return apiError('NOT_FOUND', 'Outreach not found', 404);

  return apiSuccess(outreach);
}

// PATCH /api/v1/outreaches/[id]
export async function PATCH(request, { params }) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  const { id } = await params;
  const { data, error } = await parseRequestBody(updateOutreachSchema, request);
  if (error) return error;

  await dbConnect();

  // Ensure ownership — always filter by userId from session
  const existing = await Outreach.findOne({ _id: id, userId: session.userId });
  if (!existing) return apiError('NOT_FOUND', 'Outreach not found', 404);

  const oldStatus = existing.status;

  // Only update explicitly allowed fields
  const allowedUpdates = {
    date: data.date ? new Date(data.date) : undefined,
    outreachType: data.outreachType,
    company: data.company,
    contactName: data.contactName,
    contactRole: data.contactRole,
    contactUrl: data.contactUrl,
    method: data.method,
    subjectMessage: data.subjectMessage,
    status: data.status,
    response: data.response,
    interviewScheduled: data.interviewScheduled,
    nextAction: data.nextAction,
    followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
    notes: data.notes,
  };

  // Remove undefined keys
  Object.keys(allowedUpdates).forEach((k) => allowedUpdates[k] === undefined && delete allowedUpdates[k]);

  const updated = await Outreach.findByIdAndUpdate(id, allowedUpdates, { new: true });

  // Track status change
  if (data.status && data.status !== oldStatus) {
    await OutreachStatusHistory.create({
      outreachId: id,
      userId: session.userId,
      oldStatus,
      newStatus: data.status,
      changedAt: new Date(),
      changedBy: session.userId,
    });
  }

  return apiSuccess(updated, 'Outreach updated successfully');
}

// DELETE /api/v1/outreaches/[id]
export async function DELETE(request, { params }) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  const { id } = await params;
  await dbConnect();

  const outreach = await Outreach.findOneAndDelete({ _id: id, userId: session.userId });
  if (!outreach) return apiError('NOT_FOUND', 'Outreach not found', 404);

  // Clean up reminders for deleted outreach
  await Reminder.deleteMany({ outreachId: id });

  return apiSuccess(null, 'Outreach deleted successfully');
}
