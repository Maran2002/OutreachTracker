export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db/mongodb';
import EmailRecord from '@/models/EmailRecord';
import { requireUserSession } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/utils';

/**
 * POST /api/v1/email-gallery/upsert
 * Inserts a new email contact into the gallery if the email doesn't already exist
 * for this user. If it exists, silently returns the existing record (no update).
 * Body: { name, email, position, companyName }
 */
export async function POST(request) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Invalid request body', 400);
  }

  const { name, email, position, companyName } = body;

  if (!email || !email.includes('@')) {
    return apiError('INVALID_EMAIL', 'A valid email address is required', 400);
  }

  await dbConnect();

  const normalizedEmail = email.toLowerCase().trim();

  // Check for existing record by email (user-scoped)
  const existing = await EmailRecord.findOne({
    userId: session.userId,
    email: normalizedEmail,
  }).lean();

  if (existing) {
    return apiSuccess(existing, 'Contact already exists in gallery');
  }

  // Insert new record — use provided fields, fall back to email if name missing
  const record = await EmailRecord.create({
    userId: session.userId,
    name: (name || '').trim() || normalizedEmail,
    email: normalizedEmail,
    position: (position || '').trim() || 'Unknown',
    companyName: (companyName || '').trim() || 'Unknown',
  });

  return apiSuccess(record, 'Contact added to email gallery', 201);
}
