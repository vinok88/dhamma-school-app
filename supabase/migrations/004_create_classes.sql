-- Migration 004: Create classes table and add FK from students
-- Idempotent: safe to run multiple times

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  grade_level TEXT,
  teacher_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now add the FK from students to classes (deferred from migration 003)
DO $$ BEGIN
  ALTER TABLE students
    ADD CONSTRAINT students_class_id_fkey
    FOREIGN KEY (class_id) REFERENCES classes(id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
