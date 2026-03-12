import {
  format,
  formatDistanceToNow,
  differenceInYears,
  startOfDay,
  endOfDay,
  isToday as fnsIsToday,
  parseISO,
  subDays,
  getDay,
} from 'date-fns';

export function calculateAge(dob: string): number {
  return differenceInYears(new Date(), parseISO(dob));
}

export function formatAge(dob: string, includeUnit = true): string {
  const age = calculateAge(dob);
  return includeUnit ? `${age} years old` : `${age}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMM yyyy');
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMM');
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMM yyyy, h:mm a');
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
}

export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseIsoDate(s: string): Date {
  return parseISO(s);
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export function formatDayOfWeek(date: Date): string {
  return format(date, 'EEEE');
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (fnsIsToday(d)) {
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return fnsIsToday(d);
}

export function startOfDayUtil(date: Date): Date {
  return startOfDay(date);
}

export function endOfDayUtil(date: Date): Date {
  return endOfDay(date);
}

// Returns the most recent Sunday on or before the given date
export function lastSunday(date: Date = new Date()): Date {
  const day = getDay(date);
  return subDays(date, day);
}

// Returns the last N Sundays (most recent first)
export function lastNSundays(count: number): Date[] {
  const sundays: Date[] = [];
  let current = lastSunday();
  for (let i = 0; i < count; i++) {
    sundays.push(current);
    current = subDays(current, 7);
  }
  return sundays;
}
