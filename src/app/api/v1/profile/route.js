export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import { requireUserSession } from '@/lib/auth/session';
import { parseRequestBody, updateProfileSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError } from '@/lib/utils';

// GET /api/v1/profile
export async function GET(request) {
  const { session, error } = await requireUserSession(request);
  if (error) return error;

  await dbConnect();
  const user = await User.findById(session.userId).select('-passwordHash');
  if (!user) return apiError('NOT_FOUND', 'User not found', 404);

  return apiSuccess(user);
}

// PATCH /api/v1/profile
export async function PATCH(request) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  const { data, error } = await parseRequestBody(updateProfileSchema, request);
  if (error) return error;

  await dbConnect();

  const updates = {};
  if (data.name) updates.name = data.name.trim();
  if (data.reminderSettings) {
    const user = await User.findById(session.userId);
    updates.reminderSettings = { ...user.reminderSettings.toObject(), ...data.reminderSettings };
  }

  const updated = await User.findByIdAndUpdate(session.userId, updates, { new: true }).select('-passwordHash');
  return apiSuccess(updated, 'Profile updated successfully');
}
