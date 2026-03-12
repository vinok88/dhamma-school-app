-- Migration 003: Create students table
-- Note: classes table must exist (created in 004) — forward reference handled by deferring FK
-- Idempotent: safe to run multiple times

DO $$ BEGIN
  CREATE TYPE student_status AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected',
    'active',
    'inactive',
    'dropped'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  dob DATE NOT NULL,
  gender TEXT,
  has_allergies BOOLEAN NOT NULL DEFAULT FALSE,
  allergy_notes TEXT,
  photo_url TEXT,
  photo_publish_consent BOOLEAN NOT NULL DEFAULT FALSE,
  parent_id UUID NOT NULL REFERENCES user_profiles(id),
  class_id UUID, -- FK to classes added after classes table is created
  status student_status NOT NULL DEFAULT 'pending',
  status_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- age is computed in application layer from dob — see StudentModel.age getter

DROP TRIGGER IF EXISTS set_students_updated_at ON students;
CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
