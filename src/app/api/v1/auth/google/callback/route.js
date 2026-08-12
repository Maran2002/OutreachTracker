import { cookies } from 'next/headers';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/auth/google';
import { signToken, setSessionCookie } from '@/lib/auth/session';
import { normalizeEmail } from '@/lib/utils';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Retrieve stored state cookie
  const cookieStore = await cookies();
  const storedState = cookieStore.get('google_oauth_state')?.value;

  // Clear state cookie
  cookieStore.delete('google_oauth_state');

  // Retrieve and clear intent cookie
  const intent = cookieStore.get('google_oauth_intent')?.value || 'login';
  cookieStore.delete('google_oauth_intent');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // 1. Verify state matches (CSRF Protection)
  if (!state || state !== storedState) {
    return Response.redirect(`${baseUrl}/login?error=csrf`, 302);
  }

  // 2. Check if auth code exists
  if (!code) {
    return Response.redirect(`${baseUrl}/login?error=no_code`, 302);
  }

  try {
    // 3. Exchange auth code for access token
    const tokens = await exchangeCodeForTokens(code);
    const accessToken = tokens.access_token;

    if (!accessToken) {
      return Response.redirect(`${baseUrl}/login?error=invalid_token`, 302);
    }

    // 4. Retrieve user profile info from Google
    const profile = await getGoogleUserInfo(accessToken);
    const { sub: googleId, email, name, picture: avatar } = profile;
    const normalizedEmail = normalizeEmail(email);

    await dbConnect();

    // 5. Check if user exists by googleId
    let user = await User.findOne({ googleId });

    if (user && user.status !== 'active') {
      if (intent === 'register') {
        // Free up the inactive account's credentials so a new one can be created
        const timestamp = Date.now();
        user.email = `${user.email}_inactive_${timestamp}`;
        user.googleId = `${user.googleId}_inactive_${timestamp}`;
        user.status = 'closed';
        await user.save();
        user = null; // Set to null so a new active user gets created
      } else {
        // Redirect to login/register with custom error info
        return Response.redirect(`${baseUrl}/login?error=inactive_register`, 302);
      }
    }

    if (!user) {
      // 6. Check if user exists with the same email
      let emailUser = await User.findOne({ email: normalizedEmail });

      if (emailUser && emailUser.status !== 'active') {
        if (intent === 'register') {
          // Free up the inactive account's credentials
          const timestamp = Date.now();
          emailUser.email = `${emailUser.email}_inactive_${timestamp}`;
          if (emailUser.googleId) {
            emailUser.googleId = `${emailUser.googleId}_inactive_${timestamp}`;
          }
          emailUser.status = 'closed';
          await emailUser.save();
          emailUser = null; // Set to null so a new active user gets created
        } else {
          return Response.redirect(`${baseUrl}/login?error=inactive_register`, 302);
        }
      }

      if (emailUser) {
        // Link Google OAuth to the existing local active account
        emailUser.authProvider = 'google';
        emailUser.googleId = googleId;
        if (!emailUser.avatar) emailUser.avatar = avatar;
        await emailUser.save();
        user = emailUser;
      } else {
        // Create new active account via Google
        user = await User.create({
          name: name || 'Google User',
          email: normalizedEmail,
          authProvider: 'google',
          googleId,
          avatar,
          status: 'active',
        });
      }
    }

    // 7. Check if account is active
    if (user.status !== 'active') {
      return Response.redirect(`${baseUrl}/login?error=inactive`, 302);
    }

    // 8. Update last login
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    // 9. Sign token and set session cookie
    const token = await signToken({
      userId: user._id.toString(),
      userName: user.name,
      sessionId: crypto.randomUUID(),
      role: user.role || 'user',
    });

    await setSessionCookie(token);

    // 10. Redirect to dashboard
    return Response.redirect(`${baseUrl}/dashboard`, 302);
  } catch (err) {
    console.error('Google OAuth callback handler error:', err);
    return Response.redirect(`${baseUrl}/login?error=google_auth_failed`, 302);
  }
}
