export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db/mongodb';
import Outreach from '@/models/Outreach';
import Reminder from '@/models/Reminder';
import { requireUserSession } from '@/lib/auth/session';
import { parseRequestBody, parseQueryParams, createOutreachSchema, outreachListQuerySchema } from '@/lib/validation/schemas';
import { apiSuccess, apiPaginated } from '@/lib/utils';
import { buildInitialReminders } from '@/lib/reminders';
import User from '@/models/User';

// GET /api/v1/outreaches — list with search, filter, sort, paginate
export async function GET(request) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const { data: query, error: queryError } = parseQueryParams(outreachListQuerySchema, url);
  if (queryError) return queryError;

  await dbConnect();

  const filter = { userId: session.userId };

  // Full-text search
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  // Status filter (comma-separated or single value)
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean);
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }

  // Outreach type filter
  if (query.outreachType) {
    const types = query.outreachType.split(',').filter(Boolean);
    filter.outreachType = types.length === 1 ? types[0] : { $in: types };
  }

  // Method filter
  if (query.method) {
    const methods = query.method.split(',').filter(Boolean);
    filter.method = methods.length === 1 ? methods[0] : { $in: methods };
  }

  // Interview scheduled filter
  if (query.interviewScheduled !== undefined && query.interviewScheduled !== '') {
    filter.interviewScheduled = query.interviewScheduled === 'true';
  }

  // Date range filter
  if (query.fromDate || query.toDate) {
    filter.date = {};
    if (query.fromDate) filter.date.$gte = new Date(query.fromDate);
    if (query.toDate) filter.date.$lte = new Date(query.toDate + 'T23:59:59.999Z');
  }

  const sortField = query.sortBy || 'date';
  const sortDir = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDir };

  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const [outreaches, total] = await Promise.all([
    Outreach.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Outreach.countDocuments(filter),
  ]);

  return apiPaginated(outreaches, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/v1/outreaches — create
export async function POST(request) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  const { data, error } = await parseRequestBody(createOutreachSchema, request);
  if (error) return error;

  await dbConnect();

  // IMPORTANT: userId comes from the session — never from the client body
  const outreach = await Outreach.create({
    ...data,
    userId: session.userId,
    date: new Date(data.date),
    followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
  });

  // Build and store initial reminders if follow-up is applicable
  const user = await User.findById(session.userId);
  const reminderSettings = user?.reminderSettings;

  if (reminderSettings) {
    const reminderDocs = buildInitialReminders(
      session.userId,
      outreach._id.toString(),
      outreach.date,
      reminderSettings
    );
    await Reminder.insertMany(reminderDocs);
  }

  return apiSuccess(outreach, 'Outreach record created successfully', 201);
}
