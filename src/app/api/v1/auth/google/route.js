import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getGoogleAuthUrl } from '@/lib/auth/google';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const intent = searchParams.get('intent') || 'login';

  // Generate random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // Build the Google Consent screen redirect URL
  const googleAuthUrl = getGoogleAuthUrl(state);

  const cookieStore = await cookies();
  
  // Store state in an HTTP-only cookie
  cookieStore.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60, // 10 minutes
    path: '/',
  });

  // Store intent in a cookie
  cookieStore.set('google_oauth_intent', intent, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60, // 10 minutes
    path: '/',
  });

  // Redirect user to Google OAuth page
  return Response.redirect(googleAuthUrl, 302);
}
