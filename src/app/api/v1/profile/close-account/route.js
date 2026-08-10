import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import Reminder from '@/models/Reminder';
import { requireUserSession } from '@/lib/auth/session';
import { clearSessionCookie } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/utils';

// POST /api/v1/profile/close-account
export async function POST(request) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  await dbConnect();

  const user = await User.findById(session.userId);
  if (!user) return apiError('NOT_FOUND', 'User not found', 404);

  // Soft-delete: mark account as closed
  await User.findByIdAndUpdate(session.userId, {
    status: 'closed',
    closedAt: new Date(),
    email: `closed_${Date.now()}_${user.email}`, // free up email for re-registration
  });

  // Soft delete associated data (keep for audit) - reminders are cleaned up
  await Reminder.deleteMany({ userId: session.userId });

  // Clear session cookie
  await clearSessionCookie();

  return apiSuccess(null, 'Account closed successfully');
}
