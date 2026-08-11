export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import Outreach from '@/models/Outreach';
import Admin from '@/models/Admin';
import { requireAdminSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions';
import { apiSuccess, apiError } from '@/lib/utils';

// GET /api/v1/admin/dashboard/stats
export async function GET(request) {
  const { session, error: authError } = await requireAdminSession(request);
  if (authError) return authError;

  await dbConnect();
  const actor = await Admin.findById(session.userId);
  if (!actor || !hasPermission(actor.permissions, 'dashboard.view')) {
    return apiError('FORBIDDEN', 'Missing permission: dashboard.view', 403);
  }

  const [totalUsers, totalOutreaches, totalAdmins] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Outreach.countDocuments({}),
    Admin.countDocuments({}),
  ]);

  return apiSuccess({
    totalUsers,
    totalOutreaches,
    totalAdmins,
  });
}
