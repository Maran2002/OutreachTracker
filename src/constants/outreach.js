// Outreach Types
export const OUTREACH_TYPES = [
  { value: 'cold_email', label: 'Cold Email' },
  { value: 'warm_intro', label: 'Warm Intro' },
  { value: 'linkedin_dm', label: 'LinkedIn DM' },
  { value: 'cto_email', label: 'CTO Email' },
];

// Methods
export const OUTREACH_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter_dm', label: 'Twitter DM' },
  { value: 'referral', label: 'Referral' },
];

// Statuses
export const OUTREACH_STATUSES = [
  { value: 'sent', label: 'Sent' },
  { value: 'no_response', label: 'No Response' },
  { value: 'replied', label: 'Replied' },
  { value: 'screening_call', label: 'Screening Call' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected', label: 'Rejected' },
];

// Status definitions (centralized for business logic)
export const STATUS_DEFINITIONS = {
  sent: 'Outreach was sent and a response is pending.',
  no_response: 'No response after approximately seven or more days.',
  replied: 'Recipient responded.',
  screening_call: 'A screening call has been scheduled.',
  interview: 'An interview has been scheduled.',
  rejected: 'Recipient explicitly rejected the opportunity, or the contact was considered unresponsive after two follow-ups.',
};

// Statuses that count as a "response" for response rate calculation
export const RESPONSE_STATUSES = ['replied', 'screening_call', 'interview'];

// Statuses where reminders should NOT be generated
export const TERMINAL_STATUSES = ['rejected', 'interview'];

// Default reminder settings
export const DEFAULT_REMINDER_SETTINGS = {
  intervalDays: 3,
  maxReminders: 2,
  reminderTime: '10:00',
  timezone: 'UTC',
};

// Admin permissions
export const ADMIN_PERMISSIONS = [
  { value: 'users.view', label: 'View Users' },
  { value: 'outreaches.view', label: 'View Outreaches' },
  { value: 'admins.view', label: 'View Admins' },
  { value: 'admins.create', label: 'Create Admins' },
  { value: 'admins.edit', label: 'Edit Admins' },
  { value: 'admins.delete', label: 'Delete Admins' },
  { value: 'dashboard.view', label: 'View Dashboard' },
  { value: 'profile.edit', label: 'Edit Profile' },
  { value: 'email_gallery.view', label: 'View Email Gallery' },
];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Session
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'cold_outreach_session';
export const SESSION_EXPIRY_DAYS = 7;

// Date filter presets
export const DATE_FILTER_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
];
