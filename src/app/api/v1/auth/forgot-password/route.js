import crypto from 'crypto';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { parseRequestBody, forgotPasswordSchema } from '@/lib/validation/schemas';
import { normalizeEmail } from '@/lib/utils';

// Token valid for 1 hour
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

export async function POST(request) {
  const { data, error } = await parseRequestBody(forgotPasswordSchema, request);
  if (error) return error;

  const normalizedEmail = normalizeEmail(data.email);

  // Always respond the same way to avoid revealing if email is registered
  const genericOk = new Response(
    JSON.stringify({
      success: true,
      data: null,
      message: 'If an account exists for this email, a password reset link has been sent.',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );

  await dbConnect();

  const user = await User.findOne({ email: normalizedEmail, status: 'active' });
  if (!user) return genericOk;

  // Generate a secure random token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Invalidate any existing tokens for this user
  await PasswordResetToken.deleteMany({ userId: user._id });

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
  });

  // TODO (Future): Send email with reset link containing rawToken
  // The link would be: ${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}
  // For V1, the token is stored and the reset form accepts it directly
  console.log(`[DEV] Password reset token for ${normalizedEmail}: ${rawToken}`);

  return genericOk;
}
