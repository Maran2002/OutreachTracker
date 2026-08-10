import dbConnect from '@/lib/db/mongodb';
import Admin from '@/models/Admin';
import { verifyPassword } from '@/lib/auth/password';
import { signToken, setSessionCookie } from '@/lib/auth/session';
import { parseRequestBody, adminLoginSchema } from '@/lib/validation/schemas';
import { normalizeEmail } from '@/lib/utils';

export async function POST(request) {
  const { data, error } = await parseRequestBody(adminLoginSchema, request);
  if (error) return error;

  const { email, password } = data;
  const normalizedEmail = normalizeEmail(email);

  await dbConnect();
console.log(normalizedEmail, "email");

  const admin = await Admin.findOne({ email: normalizedEmail }).select('+passwordHash');

  console.log("admin", admin)
  const genericError = new Response(
    JSON.stringify({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );

  if (!admin || !admin.passwordHash) return genericError;
  if (admin.status !== 'active') {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'ACCOUNT_INACTIVE', message: 'Admin account is inactive' } }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const passwordMatch = await verifyPassword(password, admin.passwordHash);
  if (!passwordMatch) return genericError;

  await Admin.findByIdAndUpdate(admin._id, { lastLoginAt: new Date() });

  const token = await signToken({
    userId: admin._id.toString(),
    userName: admin.name,
    sessionId: crypto.randomUUID(),
    role: 'admin',
  });

  await setSessionCookie(token);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          permissions: admin.permissions,
        },
      },
      message: 'Admin logged in successfully',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
