import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'cold_outreach_session';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-minimum-64-characters-long-for-cold-outreach-tracker-session';
const secret = new TextEncoder().encode(JWT_SECRET);

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Skip API routes — API route handlers return JSON errors (401/403)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 2. Define protected user and admin paths
  const isUserProtected =
    pathname === '/' ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/outreach' ||
    pathname.startsWith('/outreach/') ||
    pathname === '/reminders' ||
    pathname.startsWith('/reminders/') ||
    pathname === '/profile' ||
    pathname.startsWith('/profile/');

  const isAdminProtected =
    pathname.startsWith('/admin') && pathname !== '/admin/login';

  const isUserPublicAuth =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  const isAdminPublicAuth = pathname === '/admin/login';

  // 3. Extract & verify session token
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  // 4. Protection Check: User protected route without valid user session
  if (isUserProtected) {
    if (!session || session.role !== 'user') {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Protection Check: Admin protected route without valid admin session
  if (isAdminProtected) {
    if (!session || session.role !== 'admin') {
      const adminLoginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  // 6. Already authenticated user accessing public auth pages -> redirect to /dashboard
  if (isUserPublicAuth && session && session.role === 'user') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 7. Already authenticated admin accessing admin login -> redirect to /admin/dashboard
  if (isAdminPublicAuth && session && session.role === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (assets like .png, .jpg, .svg)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
