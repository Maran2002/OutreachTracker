export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db/mongodb';
import Outreach from '@/models/Outreach';
import mongoose from 'mongoose';
import { requireUserSession } from '@/lib/auth/session';
import { apiSuccess } from '@/lib/utils';
import { RESPONSE_STATUSES } from '@/constants/outreach';

// GET /api/v1/dashboard/metrics
export async function GET(request) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  await dbConnect();

  const userId = session.userId;
  const objectUserId = mongoose.Types.ObjectId.createFromHexString(userId);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Run all aggregations in parallel
  const [
    totalOutreach,
    byTypeAgg,
    byStatusAgg,
    followUpsDue,
    followUpsOverdue,
  ] = await Promise.all([
    Outreach.countDocuments({ userId }),

    Outreach.aggregate([
      { $match: { userId: { $eq: objectUserId } } },
      { $group: { _id: '$outreachType', count: { $sum: 1 } } },
    ]),

    Outreach.aggregate([
      { $match: { userId: { $eq: objectUserId } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    Outreach.countDocuments({
      userId,
      followUpDate: { $gte: todayStart },
      status: { $nin: ['rejected', 'interview'] },
    }),

    Outreach.countDocuments({
      userId,
      followUpDate: { $lt: todayStart },
      status: { $nin: ['rejected', 'interview'] },
    }),
  ]);

  // Build type map
  const byType = {};
  for (const item of byTypeAgg) byType[item._id] = item.count;

  // Build status map
  const byStatus = {};
  for (const item of byStatusAgg) byStatus[item._id] = item.count;

  // Count responses
  const responses = RESPONSE_STATUSES.reduce((sum, s) => sum + (byStatus[s] || 0), 0);
  const responseRate = totalOutreach > 0 ? Math.round((responses / totalOutreach) * 100) : 0;

  return apiSuccess({
    totalOutreach,
    byType,
    byStatus,
    responses,
    responseRate,
    screeningCalls: byStatus['screening_call'] || 0,
    interviews: byStatus['interview'] || 0,
    rejected: byStatus['rejected'] || 0,
    followUpsDue,
    followUpsOverdue,
  });
}
