-- Migration 004: students (no parent_id — see 005_student_parents)

CREATE TYPE student_status AS ENUM (
  'pending',
  'under_review',
  'approved',
  'rejected',
  'active',
  'inactive',
  'dropped'
);

CREATE TABLE students (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id              UUID NOT NULL REFERENCES schools(id),
  first_name             TEXT NOT NULL,
  last_name              TEXT NOT NULL,
  preferred_name         TEXT,
  dob                    DATE NOT NULL,
  gender                 TEXT,
  has_allergies          BOOLEAN NOT NULL DEFAULT FALSE,
  allergy_notes          TEXT,
  photo_url              TEXT,
  photo_publish_consent  BOOLEAN NOT NULL DEFAULT FALSE,
  address                TEXT,
  class_id               UUID REFERENCES classes(id),
  status                 student_status NOT NULL DEFAULT 'active',
  status_note            TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  -- Active students must have a class
  CONSTRAINT active_requires_class
    CHECK (status <> 'active' OR class_id IS NOT NULL)
);

CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
