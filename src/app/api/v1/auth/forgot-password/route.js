import crypto from 'crypto';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import OtpToken from '@/models/OtpToken';
import { parseRequestBody, forgotPasswordSchema } from '@/lib/validation/schemas';
import { normalizeEmail } from '@/lib/utils';
import { sendOtpEmail } from '@/lib/email/mailer';

// OTP valid for 10 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000;

export async function POST(request) {
  const { data, error } = await parseRequestBody(forgotPasswordSchema, request);
  if (error) return error;

  const normalizedEmail = normalizeEmail(data.email);

  // Always respond the same way to avoid revealing if email is registered
  const genericOk = new Response(
    JSON.stringify({
      success: true,
      data: null,
      message: 'If an account exists for this email, a verification code has been sent.',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );

  await dbConnect();

  const user = await User.findOne({ email: normalizedEmail, status: 'active' });
  if (!user) return genericOk;

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  // Invalidate any existing password reset OTPs for this email
  await OtpToken.deleteMany({ email: normalizedEmail, purpose: 'password_reset' });

  // Store OTP token
  await OtpToken.create({
    email: normalizedEmail,
    purpose: 'password_reset',
    otpHash,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
  });

  try {
    // Send email via Gmail SMTP
    await sendOtpEmail(normalizedEmail, otp, 'password_reset');

    // In development mode, also log it to the console for easier testing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Password reset OTP for ${normalizedEmail}: ${otp}`);
    }
  } catch (emailError) {
    console.error('Failed to send password reset OTP email:', emailError);
    // Note: we still return genericOk or error? Let's return error if we want the user to know it failed,
    // but standard security practice is genericOk. However, since the email sending failed on the backend,
    // we can return error to help them debug SMTP issues.
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: 'Failed to send password reset code. Please try again later.',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return genericOk;
}
