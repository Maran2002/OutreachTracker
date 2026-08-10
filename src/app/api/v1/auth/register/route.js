import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth/password';
import { signToken, setSessionCookie } from '@/lib/auth/session';
import { parseRequestBody, registerSchema } from '@/lib/validation/schemas';
import { normalizeEmail } from '@/lib/utils';

export async function POST(request) {
  // Parse & validate body
  const { data, error } = await parseRequestBody(registerSchema, request);
  if (error) return error;

  const { name, email, password } = data;
  const normalizedEmail = normalizeEmail(email);

  await dbConnect();

  // Check for existing account — don't reveal whether email exists (use same message)
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'EMAIL_IN_USE', message: 'An account with this email already exists' } }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    authProvider: 'local',
  });

  // Create session JWT
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
      message: 'Account created successfully',
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
}
