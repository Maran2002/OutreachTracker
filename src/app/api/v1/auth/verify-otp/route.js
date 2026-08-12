import crypto from 'crypto';
import { SignJWT } from 'jose';
import dbConnect from '@/lib/db/mongodb';
import OtpToken from '@/models/OtpToken';
import { parseRequestBody, verifyOtpSchema } from '@/lib/validation/schemas';
import { normalizeEmail } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-minimum-64-characters-long-for-cold-outreach-tracker-session';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function POST(request) {
  const { data, error } = await parseRequestBody(verifyOtpSchema, request);
  if (error) return error;

  const { email, otp, purpose } = data;
  const normalizedEmail = normalizeEmail(email);

  await dbConnect();

  // Find and verify the OTP
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const tokenRecord = await OtpToken.findOne({
    email: normalizedEmail,
    purpose,
    otpHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!tokenRecord) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INVALID_OTP', message: 'The verification code is invalid or has expired' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Mark OTP as used
  await OtpToken.findByIdAndUpdate(tokenRecord._id, { usedAt: new Date() });

  // If the purpose is password reset, we issue a short-lived resetToken (signed JWT)
  let resetToken = null;
  if (purpose === 'password_reset') {
    resetToken = await new SignJWT({ email: normalizedEmail, purpose: 'password_reset' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m') // Valid for 15 minutes to fill password form
      .sign(secret);
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: { resetToken },
      message: 'Verification successful',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
