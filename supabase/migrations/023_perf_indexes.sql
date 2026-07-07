-- Migration 023: performance indexes for the polled read paths.
--
-- The app polls several queries on a timer (messages, notifications, students,
-- announcements). Postgres does not auto-index foreign keys, so these filters
-- were sequential scans — the main driver of disk I/O (IOPS). These indexes turn
-- them into index lookups.
--
-- Uses plain CREATE INDEX (momentary lock, fine at this scale). For very large
-- tables, run the equivalent CREATE INDEX CONCURRENTLY statements individually
-- instead (they cannot run inside a transaction block).

-- notifications: WHERE user_id = ? ORDER BY created_at DESC   (polled per user)
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications (user_id, created_at DESC);

-- messages: conversations + thread use OR(sender_id, recipient_id) ORDER BY created_at
-- (polled every few seconds while a chat is open) — one index per side lets
-- Postgres bitmap-OR them.
CREATE INDEX IF NOT EXISTS messages_sender_created_idx
  ON messages (sender_id, created_at);
CREATE INDEX IF NOT EXISTS messages_recipient_created_idx
  ON messages (recipient_id, created_at);

-- students: admin list / pending-count (school_id [+ status]) and class roster
-- (class_id [+ status]).
CREATE INDEX IF NOT EXISTS students_school_status_idx
  ON students (school_id, status);
CREATE INDEX IF NOT EXISTS students_class_status_idx
  ON students (class_id, status);

-- announcements: WHERE school_id = ? ORDER BY published_at DESC
CREATE INDEX IF NOT EXISTS announcements_school_published_idx
  ON announcements (school_id, published_at DESC);

-- attendance: today's session lookup WHERE class_id = ? AND session_date = ?
-- (student history is already covered by the UNIQUE(student_id, session_date) index).
CREATE INDEX IF NOT EXISTS attendance_class_date_idx
  ON attendance_records (class_id, session_date);
