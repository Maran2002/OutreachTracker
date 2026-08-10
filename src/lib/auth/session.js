import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS } from '@/constants/outreach';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-minimum-64-characters-long-for-cold-outreach-tracker-session';

const secret = new TextEncoder().encode(JWT_SECRET);

// ---- Token operations ----

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY_DAYS}d`)
    .sign(secret);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// ---- Cookie operations ----

export async function setSessionCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ---- Session validation helpers for API route handlers ----

/**
 * Parse session from raw request (for Route Handlers).
 * @param {Request} request
 */
export async function getSessionFromRequest(request) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookieMap = parseCookies(cookieHeader);
  const token = cookieMap[SESSION_COOKIE_NAME];
  if (!token) return null;

  return verifyToken(token);
}

function parseCookies(cookieHeader) {
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...rest] = c.trim().split('=');
      return [key.trim(), decodeURIComponent(rest.join('='))];
    })
  );
}

/**
 * Require a valid user session. Returns { session } or { error: Response }.
 * @param {Request} request
 */
export async function requireUserSession(request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return {
      session: null,
      error: new Response(
        JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  if (session.role !== 'user') {
    return {
      session: null,
      error: new Response(
        JSON.stringify({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  return { session, error: null };
}

/**
 * Require a valid admin session. Returns { session } or { error: Response }.
 * @param {Request} request
 */
export async function requireAdminSession(request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return {
      session: null,
      error: new Response(
        JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  if (session.role !== 'admin') {
    return {
      session: null,
      error: new Response(
        JSON.stringify({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  return { session, error: null };
}
