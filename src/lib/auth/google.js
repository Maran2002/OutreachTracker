import { OAuth2Client } from 'google-auth-library';

const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/v1/auth/google/callback`;
};

const getClient = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
};

/**
 * Generates Google OAuth redirect URL.
 * @param {string} state - CSRF state token
 */
export function getGoogleAuthUrl(state) {
  const client = getClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state,
    prompt: 'select_account',
  });
}

/**
 * Exchanges auth authorization code for access and ID tokens.
 * @param {string} code - Auth code from Google redirect
 */
export async function exchangeCodeForTokens(code) {
  const client = getClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

/**
 * Fetches user profile info from Google userinfo endpoint using OAuth access token.
 * @param {string} accessToken
 */
export async function getGoogleUserInfo(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch Google user profile information');
  }

  return res.json();
}
