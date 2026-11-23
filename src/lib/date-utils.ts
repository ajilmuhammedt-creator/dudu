// src/lib/date-utils.ts
// Handles Asia/Kolkata time calculations, local midnight and human date formats

export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';

/**
 * Returns the current time as unix seconds (UTC)
 */
export function getNowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Returns the Date object corresponding to local midnight today in Asia/Kolkata
 */
export function getKolkataMidnightToday(): Date {
  const now = new Date();
  // Format current date in Asia/Kolkata
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [year, month, day] = formatter.format(now).split('-').map(Number);
  
  // Asia/Kolkata is UTC+5:30 (5 hours 30 minutes = 330 minutes = 19800 seconds)
  // Local midnight YYYY-MM-DD 00:00:00 in UTC is (day at 00:00:00) minus 5h30m
  const kolkataMidnightUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - (5.5 * 3600 * 1000));
  return kolkataMidnightUTC;
}

/**
 * Formats a timestamp into human readable IST format
 * e.g. "5:05 pm", "Tue 5:41 pm"
 */
export function formatISTTime(date: Date | string | number, includeDay = false): string {
  const d = typeof date === 'number' ? new Date(date * 1000) : new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: APP_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  if (includeDay) {
    options.weekday = 'short';
  }
  return new Intl.DateTimeFormat('en-IN', options).format(d);
}

/**
 * Check if a device is online: last_seen is within the last 3 minutes (180 seconds)
 */
export function isDeviceOnline(lastSeen: string | Date | null | undefined): boolean {
  if (!lastSeen) return false;
  const lastSeenDate = new Date(lastSeen).getTime();
  const diffSeconds = (Date.now() - lastSeenDate) / 1000;
  return diffSeconds >= 0 && diffSeconds <= 180;
}
