import crypto from 'crypto';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { hashPassword } from '@/lib/auth/password';
import { parseRequestBody, resetPasswordSchema } from '@/lib/validation/schemas';

export async function POST(request) {
  const { data, error } = await parseRequestBody(resetPasswordSchema, request);
  if (error) return error;

  const { token, password } = data;

  await dbConnect();

  // Hash the provided token to compare with stored hash
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const resetToken = await PasswordResetToken.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!resetToken) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Reset link is invalid or has expired' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const passwordHash = await hashPassword(password);

  // Update password and mark token as used atomically
  await Promise.all([
    User.findByIdAndUpdate(resetToken.userId, { passwordHash }),
    PasswordResetToken.findByIdAndUpdate(resetToken._id, { usedAt: new Date() }),
  ]);

  return new Response(
    JSON.stringify({ success: true, data: null, message: 'Password reset successfully. Please log in.' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
