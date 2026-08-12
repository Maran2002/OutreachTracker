import { z } from 'zod';

// ---- Auth schemas ----

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address').max(255),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
  purpose: z.enum(['email_verification', 'password_reset']),
});

// ---- Outreach schemas ----

const OUTREACH_TYPES = ['cold_email', 'warm_intro', 'linkedin_dm', 'cto_email'];
const OUTREACH_METHODS = ['email', 'linkedin', 'twitter_dm', 'referral'];
const OUTREACH_STATUSES = ['sent', 'no_response', 'replied', 'screening_call', 'interview', 'rejected'];

export const createOutreachSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  outreachType: z.enum(OUTREACH_TYPES, { errorMap: () => ({ message: 'Invalid outreach type' }) }),
  company: z.string().min(1, 'Company is required').max(200),
  contactName: z.string().min(1, 'Contact name is required').max(200),
  contactRole: z.string().max(200).optional(),
  contactUrl: z.string().max(500).optional(),
  method: z.enum(OUTREACH_METHODS, { errorMap: () => ({ message: 'Invalid method' }) }),
  subjectMessage: z.string().max(2000).optional(),
  status: z.enum(OUTREACH_STATUSES).default('sent'),
  response: z.string().max(2000).optional(),
  interviewScheduled: z.boolean().default(false),
  nextAction: z.string().max(500).optional(),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().max(3000).optional(),
});

export const updateOutreachSchema = createOutreachSchema.partial();

export const updateOutreachStatusSchema = z.object({
  status: z.enum(OUTREACH_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }),
  note: z.string().max(500).optional(),
});

// ---- Outreach list query schema ----

export const outreachListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  status: z.string().optional(),
  outreachType: z.string().optional(),
  method: z.string().optional(),
  interviewScheduled: z.string().optional(),
  sortBy: z
    .enum(['date', 'company', 'contactName', 'status', 'followUpDate', 'outreachType'])
    .default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

// ---- Profile schemas ----

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  reminderSettings: z
    .object({
      intervalDays: z.number().int().min(1).max(30).optional(),
      maxReminders: z.number().int().min(1).max(10).optional(),
      reminderTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format')
        .optional(),
      timezone: z.string().max(50).optional(),
    })
    .optional(),
});

// ---- Admin schemas ----

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

export const createAdminSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address').max(255),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    permissions: z.array(z.string()).default([]),
    status: z.enum(['active', 'inactive']).default('active'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateAdminSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().max(255).optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .optional()
      .or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
    permissions: z.array(z.string()).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  })
  .refine(
    (d) => {
      if (d.password && d.password !== '') {
        return d.password === d.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  status: z.enum(['active', 'inactive', 'closed']).optional(),
  authProvider: z.enum(['local', 'google']).optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ---- Email Gallery schemas ----

export const createEmailRecordSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address').max(255),
  position: z.string().min(1, 'Position is required').max(200),
  companyName: z.string().min(1, 'Company name is required').max(200),
});

export const updateEmailRecordSchema = createEmailRecordSchema.partial();

export const emailRecordListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().max(200).optional(),
  sortBy: z
    .enum(['name', 'email', 'position', 'companyName', 'createdAt', 'updatedAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  userId: z.string().optional(),
});

/**
 * Parse and validate Zod schema from a URL's search params.
 * Returns { data } on success or { error: Response } on failure.
 * @param {z.ZodSchema} schema
 * @param {URL} url
 */
export function parseQueryParams(schema, url) {
  const raw = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      data: null,
      error: new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
  return { data: result.data, error: null };
}

/**
 * Parse and validate Zod schema from a JSON request body.
 * Returns { data } on success or { error: Response } on failure.
 * @param {z.ZodSchema} schema
 * @param {Request} request
 */
export async function parseRequestBody(schema, request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return {
      data: null,
      error: new Response(
        JSON.stringify({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      data: null,
      error: new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message, details: result.error.errors },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
  return { data: result.data, error: null };
}
