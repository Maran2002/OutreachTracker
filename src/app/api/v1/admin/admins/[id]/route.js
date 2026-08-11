import dbConnect from '@/lib/db/mongodb';
import Admin from '@/models/Admin';
import { requireAdminSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions';
import { parseRequestBody, updateAdminSchema } from '@/lib/validation/schemas';
import { hashPassword } from '@/lib/auth/password';
import { apiSuccess, apiError } from '@/lib/utils';

// GET /api/v1/admin/admins/[id]
export async function GET(request, { params }) {
  const { session, error: authError } = await requireAdminSession(request);
  if (authError) return authError;

  await dbConnect();
  const actor = await Admin.findById(session.userId);
  if (!actor || !hasPermission(actor.permissions, 'admins.view')) {
    return apiError('FORBIDDEN', 'Missing permission: admins.view', 403);
  }

  const { id } = await params;
  const admin = await Admin.findById(id).lean();
  if (!admin) return apiError('NOT_FOUND', 'Admin not found', 404);

  return apiSuccess(admin);
}

// PATCH /api/v1/admin/admins/[id]
export async function PATCH(request, { params }) {
  const { session, error: authError } = await requireAdminSession(request);
  if (authError) return authError;

  await dbConnect();
  const actor = await Admin.findById(session.userId);
  const { id } = await params;

  const isSelf = id === session.userId;

  if (isSelf) {
    // Self-update requires profile.edit permission
    if (!actor || !hasPermission(actor.permissions, 'profile.edit')) {
      return apiError('FORBIDDEN', 'Missing permission: profile.edit', 403);
    }
  } else if (!actor || !hasPermission(actor.permissions, 'admins.edit')) {
    // Editing another admin requires admins.edit permission
    return apiError('FORBIDDEN', 'Missing permission: admins.edit', 403);
  }

  const { data, error } = await parseRequestBody(updateAdminSchema, request);
  if (error) return error;

  const updates = {};
  if (data.name) updates.name = data.name.trim();
  if (data.email) updates.email = data.email.toLowerCase().trim();
  
  if (data.password && data.password !== '') {
    updates.passwordHash = await hashPassword(data.password);
  }

  // Restrict updating status or permissions to admins.edit permission holders only
  if (data.permissions !== undefined) {
    if (!actor || !hasPermission(actor.permissions, 'admins.edit')) {
      return apiError('FORBIDDEN', 'Missing permission to modify admin permissions', 403);
    }
    updates.permissions = data.permissions;
  }

  if (data.status) {
    if (!actor || !hasPermission(actor.permissions, 'admins.edit')) {
      return apiError('FORBIDDEN', 'Missing permission to modify admin status', 403);
    }
    updates.status = data.status;
  }

  const updated = await Admin.findByIdAndUpdate(id, updates, { new: true });
  if (!updated) return apiError('NOT_FOUND', 'Admin not found', 404);

  return apiSuccess(updated, 'Admin updated successfully');
}

// DELETE /api/v1/admin/admins/[id]
export async function DELETE(request, { params }) {
  const { session, error: authError } = await requireAdminSession(request);
  if (authError) return authError;

  await dbConnect();
  const actor = await Admin.findById(session.userId);
  if (!actor || !hasPermission(actor.permissions, 'admins.delete')) {
    return apiError('FORBIDDEN', 'Missing permission: admins.delete', 403);
  }

  const { id } = await params;

  // Prevent self-deletion
  if (id === session.userId) {
    return apiError('SELF_DELETE', 'You cannot delete your own admin account', 400);
  }

  const deleted = await Admin.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
  if (!deleted) return apiError('NOT_FOUND', 'Admin not found', 404);

  return apiSuccess(null, 'Admin deactivated successfully');
}
