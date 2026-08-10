import { clearSessionCookie } from '@/lib/auth/session';

export async function POST() {
  await clearSessionCookie();
  return new Response(
    JSON.stringify({ success: true, data: null, message: 'Admin logged out' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
