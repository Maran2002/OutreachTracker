export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import Outreach from '@/models/Outreach';
import Admin from '@/models/Admin';
import { requireAdminSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions';
import { parseQueryParams, userListQuerySchema } from '@/lib/validation/schemas';
import { apiPaginated, apiError } from '@/lib/utils';

// GET /api/v1/admin/users  — read-only
export async function GET(request) {
  const { session, error: authError } = await requireAdminSession(request);
  if (authError) return authError;

  await dbConnect();
  const actor = await Admin.findById(session.userId);
  if (!actor || !hasPermission(actor.permissions, 'users.view')) {
    return apiError('FORBIDDEN', 'Missing permission: users.view', 403);
  }

  const url = new URL(request.url);
  const { data: query, error: queryError } = parseQueryParams(userListQuerySchema, url);
  if (queryError) return queryError;

  const filter = { role: 'user' };
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }
  if (query.status) filter.status = query.status;
  if (query.authProvider) filter.authProvider = query.authProvider;

  const sort = { [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 };
  const skip = (query.page - 1) * query.limit;

  const [users, total] = await Promise.all([
    User.find(filter).select('-passwordHash').sort(sort).skip(skip).limit(query.limit).lean(),
    User.countDocuments(filter),
  ]);

  // Attach outreach counts
  const userIds = users.map((u) => u._id);
  const outreachCounts = await Outreach.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  for (const c of outreachCounts) countMap[c._id.toString()] = c.count;

  const enriched = users.map((u) => ({ ...u, outreachCount: countMap[u._id.toString()] || 0 }));

  return apiPaginated(enriched, { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) });
}
