export const dynamic = 'force-dynamic';

import { getSessionFromCookies } from '@/lib/auth/session';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';

export async function GET() {
  const session = await getSessionFromCookies();

  if (!session || session.role !== 'user') {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  await dbConnect();
  const user = await User.findById(session.userId).select('-passwordHash');

  if (!user || user.status !== 'active') {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Session invalid' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: { user } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
