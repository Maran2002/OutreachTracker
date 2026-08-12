import crypto from 'crypto';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import OtpToken from '@/models/OtpToken';
import { hashPassword } from '@/lib/auth/password';
import { parseRequestBody, registerSchema } from '@/lib/validation/schemas';
import { normalizeEmail } from '@/lib/utils';
import { sendOtpEmail } from '@/lib/email/mailer';

// OTP expires in 10 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000;

export async function POST(request) {
  // Parse and validate the registration fields
  const { data, error } = await parseRequestBody(registerSchema, request);
  if (error) return error;

  const { name, email, password } = data;
  const normalizedEmail = normalizeEmail(email);

  await dbConnect();

  // Check if a user already exists with this email
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

  // Generate 6-digit OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  // Hash the password for safety before storing it temporarily
  const passwordHash = await hashPassword(password);

  // Invalidate any existing verification OTPs for this email
  await OtpToken.deleteMany({ email: normalizedEmail, purpose: 'email_verification' });

  // Store OTP token and pending user data
  await OtpToken.create({
    email: normalizedEmail,
    purpose: 'email_verification',
    otpHash,
    pendingUserData: {
      name: name.trim(),
      passwordHash,
    },
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
  });

  try {
    // Send email via Gmail SMTP
    await sendOtpEmail(normalizedEmail, otp, 'email_verification');
    
    // In development mode, also log it to the console for easier testing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Registration OTP for ${normalizedEmail}: ${otp}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'A 6-digit verification code has been sent to your email address.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (emailError) {
    console.error('Failed to send registration OTP email:', emailError);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: 'Failed to send verification email. Please check your SMTP configuration or try again.',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
