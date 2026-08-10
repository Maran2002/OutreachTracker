import dbConnect from '@/lib/db/mongodb';
import Outreach from '@/models/Outreach';
import OutreachStatusHistory from '@/models/OutreachStatusHistory';
import { requireUserSession } from '@/lib/auth/session';
import { parseRequestBody, updateOutreachStatusSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError } from '@/lib/utils';

// PATCH /api/v1/outreaches/[id]/status
export async function PATCH(request, { params }) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  const { id } = await params;
  const { data, error } = await parseRequestBody(updateOutreachStatusSchema, request);
  if (error) return error;

  await dbConnect();

  const outreach = await Outreach.findOne({ _id: id, userId: session.userId });
  if (!outreach) return apiError('NOT_FOUND', 'Outreach not found', 404);

  const oldStatus = outreach.status;
  if (oldStatus === data.status) {
    return apiSuccess(outreach, 'Status unchanged');
  }

  outreach.status = data.status;
  // Update interviewScheduled flag automatically
  if (data.status === 'interview') {
    outreach.interviewScheduled = true;
  }
  await outreach.save();

  // Record status change history
  await OutreachStatusHistory.create({
    outreachId: id,
    userId: session.userId,
    oldStatus,
    newStatus: data.status,
    note: data.note,
    changedAt: new Date(),
    changedBy: session.userId,
  });

  return apiSuccess(outreach, 'Status updated successfully');
}
