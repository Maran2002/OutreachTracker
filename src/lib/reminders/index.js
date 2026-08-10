import { TERMINAL_STATUSES, DEFAULT_REMINDER_SETTINGS } from '@/constants/outreach';

/**
 * Determine if a given outreach record is eligible for a reminder.
 * Centralised logic — never duplicated in route handlers or UI.
 *
 * @param {object} outreach - Outreach document
 * @param {object} reminderSettings - User's reminder settings
 * @returns {boolean}
 */
export function isEligibleForReminder(outreach, reminderSettings = DEFAULT_REMINDER_SETTINGS) {
  // Terminal statuses never get reminders
  if (TERMINAL_STATUSES.includes(outreach.status)) return false;

  // Already at or beyond the max reminder count
  if (outreach.reminderCount >= reminderSettings.maxReminders) return false;

  return true;
}

/**
 * Calculate the date for the next reminder.
 *
 * @param {Date|string} baseDate - The date to calculate from (outreach date or last follow-up date)
 * @param {number} reminderNumber - Which reminder number this is (1-based)
 * @param {number} intervalDays - Days between reminders
 * @returns {Date}
 */
export function calculateNextReminderDate(baseDate, reminderNumber, intervalDays) {
  const base = new Date(baseDate);
  const daysOffset = intervalDays * reminderNumber;
  const next = new Date(base);
  next.setDate(next.getDate() + daysOffset);
  return next;
}

/**
 * Get all due reminders for a user — pending reminders where scheduledFor <= now.
 * This is a pure calculation helper; DB queries live in the repository/service.
 *
 * @param {object[]} reminders - Array of Reminder documents (with outreach populated)
 * @returns {{ upcoming: object[], dueToday: object[], overdue: object[] }}
 */
export function categoriseReminders(reminders) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const upcoming = [];
  const dueToday = [];
  const overdue = [];

  for (const reminder of reminders) {
    const scheduled = new Date(reminder.scheduledFor);
    if (scheduled < todayStart) {
      overdue.push(reminder);
    } else if (scheduled >= todayStart && scheduled <= todayEnd) {
      dueToday.push(reminder);
    } else {
      upcoming.push(reminder);
    }
  }

  return { upcoming, dueToday, overdue };
}

/**
 * Build the list of reminder documents to create when a new outreach is saved.
 *
 * @param {string} userId
 * @param {string} outreachId
 * @param {Date|string} outreachDate
 * @param {object} reminderSettings
 * @returns {object[]} Array of reminder objects ready for DB insertion
 */
export function buildInitialReminders(userId, outreachId, outreachDate, reminderSettings = DEFAULT_REMINDER_SETTINGS) {
  const reminders = [];
  for (let i = 1; i <= reminderSettings.maxReminders; i++) {
    reminders.push({
      userId,
      outreachId,
      reminderNumber: i,
      scheduledFor: calculateNextReminderDate(outreachDate, i, reminderSettings.intervalDays),
      status: 'pending',
    });
  }
  return reminders;
}
