export const dynamic = 'force-dynamic';

import { getSessionFromCookies } from '@/lib/auth/session';
import dbConnect from '@/lib/db/mongodb';
import Admin from '@/models/Admin';

export async function GET() {
  const session = await getSessionFromCookies();

  if (!session || session.role !== 'admin') {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  await dbConnect();
  const admin = await Admin.findById(session.userId).select('-passwordHash');

  if (!admin || admin.status !== 'active') {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Session invalid' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: { admin } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
