export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db/mongodb';
import Reminder from '@/models/Reminder';
import { requireUserSession } from '@/lib/auth/session';
import { apiSuccess } from '@/lib/utils';
import { categoriseReminders } from '@/lib/reminders';

// GET /api/v1/reminders
export async function GET(request) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  await dbConnect();

  const reminders = await Reminder.find({
    userId: session.userId,
    status: { $in: ['pending', 'shown'] },
  })
    .populate('outreachId', 'company contactName status followUpDate outreachType method')
    .sort({ scheduledFor: 1 })
    .lean();

  const { upcoming, dueToday, overdue } = categoriseReminders(reminders);

  return apiSuccess({ upcoming, dueToday, overdue });
}
