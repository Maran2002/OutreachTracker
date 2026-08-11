export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db/mongodb';
import EmailRecord from '@/models/EmailRecord';
import { requireUserSession } from '@/lib/auth/session';
import { parseRequestBody, updateEmailRecordSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError } from '@/lib/utils';

// GET /api/v1/email-gallery/[id]
export async function GET(request, { params }) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  const { id } = await params;
  await dbConnect();

  const record = await EmailRecord.findOne({ _id: id, userId: session.userId }).lean();
  if (!record) return apiError('NOT_FOUND', 'Email record not found', 404);

  return apiSuccess(record);
}

// PATCH /api/v1/email-gallery/[id]
export async function PATCH(request, { params }) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  const { id } = await params;
  const { data, error } = await parseRequestBody(updateEmailRecordSchema, request);
  if (error) return error;

  await dbConnect();

  // Ensure ownership — filter by userId from session
  const existing = await EmailRecord.findOne({ _id: id, userId: session.userId });
  if (!existing) return apiError('NOT_FOUND', 'Email record not found', 404);

  const allowedUpdates = {
    name: data.name,
    email: data.email,
    position: data.position,
    companyName: data.companyName,
  };

  // Remove undefined keys
  Object.keys(allowedUpdates).forEach((k) => allowedUpdates[k] === undefined && delete allowedUpdates[k]);

  const updated = await EmailRecord.findByIdAndUpdate(id, allowedUpdates, { new: true });

  return apiSuccess(updated, 'Email record updated successfully');
}

// DELETE /api/v1/email-gallery/[id]
export async function DELETE(request, { params }) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  const { id } = await params;
  await dbConnect();

  const record = await EmailRecord.findOneAndDelete({ _id: id, userId: session.userId });
  if (!record) return apiError('NOT_FOUND', 'Email record not found', 404);

  return apiSuccess(null, 'Email record deleted successfully');
}
