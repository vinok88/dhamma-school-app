-- Migration 003: classes
-- Created before students so the FK is straightforward.

CREATE TABLE classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id),
  name        TEXT NOT NULL,
  grade_level TEXT,
  teacher_id  UUID REFERENCES user_profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
