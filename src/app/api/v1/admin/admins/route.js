export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db/mongodb';
import Admin from '@/models/Admin';
import { requireAdminSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions';
import { parseRequestBody, parseQueryParams, createAdminSchema, adminListQuerySchema } from '@/lib/validation/schemas';
import { hashPassword } from '@/lib/auth/password';
import { normalizeEmail, apiSuccess, apiPaginated, apiError } from '@/lib/utils';

// GET /api/v1/admin/admins
export async function GET(request) {
  const { session, error: authError } = await requireAdminSession(request);
  if (authError) return authError;

  await dbConnect();
  const admin = await Admin.findById(session.userId);
  if (!admin || !hasPermission(admin.permissions, 'admins.view')) {
    return apiError('FORBIDDEN', 'Missing permission: admins.view', 403);
  }

  const url = new URL(request.url);
  const { data: query, error: queryError } = parseQueryParams(adminListQuerySchema, url);
  if (queryError) return queryError;

  const filter = {};
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }
  if (query.status) filter.status = query.status;

  const sort = { [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 };
  const skip = (query.page - 1) * query.limit;

  const [admins, total] = await Promise.all([
    Admin.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
    Admin.countDocuments(filter),
  ]);

  return apiPaginated(admins, { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) });
}

// POST /api/v1/admin/admins
export async function POST(request) {
  const { session, error: authError } = await requireAdminSession(request);
  if (authError) return authError;

  await dbConnect();
  const actor = await Admin.findById(session.userId);
  if (!actor || !hasPermission(actor.permissions, 'admins.create')) {
    return apiError('FORBIDDEN', 'Missing permission: admins.create', 403);
  }

  const { data, error } = await parseRequestBody(createAdminSchema, request);
  if (error) return error;

  const normalizedEmail = normalizeEmail(data.email);
  const existing = await Admin.findOne({ email: normalizedEmail });
  if (existing) return apiError('EMAIL_IN_USE', 'An admin with this email already exists', 409);

  const passwordHash = await hashPassword(data.password);

  const newAdmin = await Admin.create({
    name: data.name.trim(),
    email: normalizedEmail,
    passwordHash,
    permissions: data.permissions || [],
    status: data.status || 'active',
  });

  return apiSuccess(newAdmin, 'Admin created successfully', 201);
}
