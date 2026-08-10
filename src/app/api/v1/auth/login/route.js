import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import { verifyPassword } from '@/lib/auth/password';
import { signToken, setSessionCookie } from '@/lib/auth/session';
import { parseRequestBody, loginSchema } from '@/lib/validation/schemas';
import { normalizeEmail } from '@/lib/utils';

export async function POST(request) {
  const { data, error } = await parseRequestBody(loginSchema, request);
  if (error) return error;

  const { email, password } = data;
  const normalizedEmail = normalizeEmail(email);

  await dbConnect();

  // Fetch user WITH passwordHash (select: false in schema, must explicitly include)
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  // Use generic error — don't reveal whether email is registered
  const genericError = new Response(
    JSON.stringify({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );

  if (!user || !user.passwordHash) return genericError;
  if (user.status !== 'active') {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'ACCOUNT_INACTIVE', message: 'Your account is inactive' } }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const passwordMatch = await verifyPassword(password, user.passwordHash);
  if (!passwordMatch) return genericError;

  // Update last login
  await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  const token = await signToken({
    userId: user._id.toString(),
    userName: user.name,
    sessionId: crypto.randomUUID(),
    role: 'user',
  });

  await setSessionCookie(token);

  return new Response(
    JSON.stringify({
      success: true,
      data: { user: { _id: user._id, name: user.name, email: user.email } },
      message: 'Logged in successfully',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
