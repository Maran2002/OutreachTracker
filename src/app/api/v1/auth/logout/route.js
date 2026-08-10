import { clearSessionCookie } from '@/lib/auth/session';

export async function POST() {
  await clearSessionCookie();

  return new Response(
    JSON.stringify({ success: true, data: null, message: 'Logged out successfully' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
