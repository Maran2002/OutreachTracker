import dbConnect from '@/lib/db/mongodb';
import Reminder from '@/models/Reminder';
import { requireUserSession } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/utils';

// PATCH /api/v1/reminders/[id]  — update status (complete/dismiss)
export async function PATCH(request, { params }) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  const { id } = await params;

  let body;
  try { body = await request.json(); } catch { body = {}; }

  const allowedStatuses = ['shown', 'completed', 'dismissed'];
  const { status } = body;

  if (!status || !allowedStatuses.includes(status)) {
    return apiError('VALIDATION_ERROR', 'Status must be one of: shown, completed, dismissed', 400);
  }

  await dbConnect();

  const reminder = await Reminder.findOneAndUpdate(
    { _id: id, userId: session.userId },
    { status, ...(status === 'completed' ? { completedAt: new Date() } : {}) },
    { new: true }
  );

  if (!reminder) return apiError('NOT_FOUND', 'Reminder not found', 404);

  return apiSuccess(reminder, 'Reminder updated');
}
