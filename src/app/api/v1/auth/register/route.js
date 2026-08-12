import crypto from 'crypto';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import OtpToken from '@/models/OtpToken';
import { signToken, setSessionCookie } from '@/lib/auth/session';
import { parseRequestBody, verifyOtpSchema } from '@/lib/validation/schemas';
import { normalizeEmail } from '@/lib/utils';

export async function POST(request) {
  // Parse & validate body with verifyOtpSchema
  const { data, error } = await parseRequestBody(verifyOtpSchema, request);
  if (error) return error;

  const { email, otp } = data;
  const normalizedEmail = normalizeEmail(email);

  await dbConnect();

  // Find the valid OTP token
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const tokenRecord = await OtpToken.findOne({
    email: normalizedEmail,
    purpose: 'email_verification',
    otpHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!tokenRecord || !tokenRecord.pendingUserData) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INVALID_OTP', message: 'The verification code is invalid or has expired' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Double check if user was registered in the meantime
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    if (existingUser.status !== 'active') {
      // Free up the inactive account's credentials so a new one can be created
      const timestamp = Date.now();
      existingUser.email = `${existingUser.email}_inactive_${timestamp}`;
      if (existingUser.googleId) {
        existingUser.googleId = `${existingUser.googleId}_inactive_${timestamp}`;
      }
      existingUser.status = 'closed';
      await existingUser.save();
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'EMAIL_IN_USE', message: 'An account with this email already exists' },
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  const { name, passwordHash } = tokenRecord.pendingUserData;

  // Create the actual user
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    authProvider: 'local',
  });

  // Mark token as used and cleanup other verification tokens for this email
  await Promise.all([
    OtpToken.findByIdAndUpdate(tokenRecord._id, { usedAt: new Date() }),
    OtpToken.deleteMany({ email: normalizedEmail, purpose: 'email_verification' }),
  ]);

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
      message: 'Account created and verified successfully',
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
}
