import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth/password';
import { parseRequestBody, resetPasswordSchema } from '@/lib/validation/schemas';
import { normalizeEmail } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-minimum-64-characters-long-for-cold-outreach-tracker-session';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function POST(request) {
  const { data, error } = await parseRequestBody(resetPasswordSchema, request);
  if (error) return error;

  const { token, password } = data; // "token" here corresponds to our signed resetToken JWT

  await dbConnect();

  let email;
  try {
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.purpose !== 'password_reset') {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Reset token is invalid or has expired' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    email = normalizeEmail(payload.email);
  } catch (err) {
    console.error('JWT verification failed for reset-password:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Reset token is invalid or has expired' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Find the active user
  const user = await User.findOne({ email, status: 'active' });
  if (!user) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found or is inactive' },
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Hash new password and update user
  const passwordHash = await hashPassword(password);
  await User.findByIdAndUpdate(user._id, { passwordHash });

  return new Response(
    JSON.stringify({ success: true, data: null, message: 'Password reset successfully. Please log in.' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
