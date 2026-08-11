export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db/mongodb';
import EmailRecord from '@/models/EmailRecord';
import { requireUserSession } from '@/lib/auth/session';
import { parseRequestBody, parseQueryParams, createEmailRecordSchema, emailRecordListQuerySchema } from '@/lib/validation/schemas';
import { apiSuccess, apiPaginated } from '@/lib/utils';

// GET /api/v1/email-gallery
export async function GET(request) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const { data: query, error: queryError } = parseQueryParams(emailRecordListQuerySchema, url);
  if (queryError) return queryError;

  await dbConnect();

  // Scoped strictly to the logged-in user
  const filter = { userId: session.userId };

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const sortField = query.sortBy || 'createdAt';
  const sortDir = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDir };

  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    EmailRecord.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    EmailRecord.countDocuments(filter),
  ]);

  return apiPaginated(records, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/v1/email-gallery
export async function POST(request) {
  const { session, error: authError } = await requireUserSession(request);
  if (authError) return authError;

  const { data, error } = await parseRequestBody(createEmailRecordSchema, request);
  if (error) return error;

  await dbConnect();

  const record = await EmailRecord.create({
    ...data,
    userId: session.userId,
  });

  return apiSuccess(record, 'Email record added to gallery successfully', 201);
}
