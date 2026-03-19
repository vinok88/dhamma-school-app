export const APP_NAME = 'Dhamma School';
export const APP_FULL_NAME = 'Mahamevnawa Dhamma School – Melbourne';
export const APP_ORGANISATION = 'Mahamevnawa Buddhist Monastery';

// Supabase table names
export const TABLES = {
  SCHOOLS: 'schools',
  USER_PROFILES: 'user_profiles',
  STUDENTS: 'students',
  CLASSES: 'classes',
  ATTENDANCE_RECORDS: 'attendance_records',
  ANNOUNCEMENTS: 'announcements',
  EVENTS: 'events',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
} as const;

// Supabase storage buckets
export const STORAGE = {
  STUDENT_PHOTOS: 'student-photos',
  PROFILE_PHOTOS: 'profile-photos',
} as const;

// Colors
export const COLORS = {
  primary: '#D4873A',
  navy: '#052254',
  gold: '#E8A84C',
  cream: '#F5EFE6',
  brown: '#614141',
  success: '#4CAF87',
  error: '#C0392B',
  pending: '#F39C12',
  white: '#FFFFFF',
  scaffoldBg: '#FAF6F0',
  cardBg: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textMuted: '#8B7D6B',
  divider: '#EDE8E0',
} as const;

// App config
export const PAGE_SIZE = 20;
export const SIGNED_URL_EXPIRY = 3600; // seconds
export const SESSION_DAY_OF_WEEK = 0; // Sunday

// Student status labels and colors
export const STUDENT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: 'Pending', color: '#F39C12', bg: '#FEF3C7' },
  under_review: { label: 'Under Review', color: '#3B82F6', bg: '#DBEAFE' },
  approved: { label: 'Approved', color: '#4CAF87', bg: '#D1FAE5' },
  rejected: { label: 'Rejected', color: '#C0392B', bg: '#FEE2E2' },
  active: { label: 'Active', color: '#4CAF87', bg: '#D1FAE5' },
  inactive: { label: 'Inactive', color: '#6B7280', bg: '#F3F4F6' },
  dropped: { label: 'Dropped', color: '#C0392B', bg: '#FEE2E2' },
};

// Event type config
export const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  poya: { label: 'Poya Program', color: '#F7B656', icon: '🌕' },
  sermon: { label: 'Sermon', color: '#3B82F6', icon: '🙏' },
  exam: { label: 'Exam', color: '#C0392B', icon: '📝' },
  holiday: { label: 'Holiday', color: '#4CAF87', icon: '🌿' },
  special: { label: 'Special Event', color: '#8B5CF6', icon: '⭐' },
};

// Announcement type config
export const ANNOUNCEMENT_TYPE_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  school: { label: 'School', color: '#052254' },
  class: { label: 'Class', color: '#3B82F6' },
  emergency: { label: 'Emergency', color: '#C0392B' },
  event_reminder: { label: 'Event', color: '#F7B656' },
};

// Attendance status config
export const ATTENDANCE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  present: { label: 'Present', color: '#4CAF87', bg: '#D1FAE5' },
  checked_in: { label: 'Checked In', color: '#3B82F6', bg: '#DBEAFE' },
  checked_out: { label: 'Checked Out', color: '#8B5CF6', bg: '#EDE9FE' },
  absent: { label: 'Absent', color: '#C0392B', bg: '#FEE2E2' },
};
