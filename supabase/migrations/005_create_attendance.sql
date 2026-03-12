-- Migration 005: Create attendance_records table
-- Idempotent: safe to run multiple times

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM (
    'present',
    'checked_in',
    'checked_out',
    'absent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  student_id UUID NOT NULL REFERENCES students(id),
  teacher_id UUID NOT NULL REFERENCES user_profiles(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  session_date DATE NOT NULL,
  checkin_time TIMESTAMPTZ,
  checkout_time TIMESTAMPTZ,
  status attendance_status NOT NULL DEFAULT 'absent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, session_date)
);
