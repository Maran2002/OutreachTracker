export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db/mongodb';
import Outreach from '@/models/Outreach';
import Admin from '@/models/Admin';
import '@/models/User';
import { requireAdminSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions';
import { parseQueryParams, outreachListQuerySchema } from '@/lib/validation/schemas';
import { apiPaginated, apiError } from '@/lib/utils';

// GET /api/v1/admin/outreaches  — global read-only view of all outreach
export async function GET(request) {
  const { session, error: authError } = await requireAdminSession(request);
  if (authError) return authError;

  await dbConnect();
  const actor = await Admin.findById(session.userId);
  if (!actor || !hasPermission(actor.permissions, 'outreaches.view')) {
    return apiError('FORBIDDEN', 'Missing permission: outreaches.view', 403);
  }

  const url = new URL(request.url);
  const { data: query, error: queryError } = parseQueryParams(outreachListQuerySchema, url);
  if (queryError) return queryError;

  // Admin queries are NOT scoped to a userId — they see all records
  const filter = {};
  if (query.search) filter.$text = { $search: query.search };
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean);
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }
  if (query.outreachType) {
    const types = query.outreachType.split(',').filter(Boolean);
    filter.outreachType = types.length === 1 ? types[0] : { $in: types };
  }
  if (query.method) {
    const methods = query.method.split(',').filter(Boolean);
    filter.method = methods.length === 1 ? methods[0] : { $in: methods };
  }
  if (query.fromDate || query.toDate) {
    filter.date = {};
    if (query.fromDate) filter.date.$gte = new Date(query.fromDate);
    if (query.toDate) filter.date.$lte = new Date(query.toDate + 'T23:59:59.999Z');
  }

  const sort = { [query.sortBy || 'date']: query.sortOrder === 'asc' ? 1 : -1 };
  const skip = (query.page - 1) * query.limit;

  const [outreaches, total] = await Promise.all([
    Outreach.find(filter)
      .populate('userId', 'name email')
      .sort(sort).skip(skip).limit(query.limit).lean(),
    Outreach.countDocuments(filter),
  ]);

  return apiPaginated(outreaches, { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) });
}
