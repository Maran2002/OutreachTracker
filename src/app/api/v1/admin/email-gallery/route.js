export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db/mongodb';
import EmailRecord from '@/models/EmailRecord';
import Admin from '@/models/Admin';
import '@/models/User'; // Ensure User model is registered for populate
import { requireAdminSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions';
import { parseQueryParams, emailRecordListQuerySchema } from '@/lib/validation/schemas';
import { apiPaginated, apiError } from '@/lib/utils';

// GET /api/v1/admin/email-gallery  — global read-only view of all emails
export async function GET(request) {
  const { session, error: authError } = await requireAdminSession(request);
  if (authError) return authError;

  await dbConnect();
  const actor = await Admin.findById(session.userId);
  if (!actor || !hasPermission(actor.permissions, 'email_gallery.view')) {
    return apiError('FORBIDDEN', 'Missing permission: email_gallery.view', 403);
  }

  const url = new URL(request.url);
  const { data: query, error: queryError } = parseQueryParams(emailRecordListQuerySchema, url);
  if (queryError) return queryError;

  const filter = {};

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  if (query.userId) {
    filter.userId = query.userId;
  }

  const sortField = query.sortBy || 'createdAt';
  const sortDir = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDir };

  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    EmailRecord.find(filter)
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    EmailRecord.countDocuments(filter),
  ]);

  return apiPaginated(records, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
