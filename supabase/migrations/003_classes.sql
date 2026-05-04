-- Migration 003: classes + class_teachers (many-to-many)
-- Created before students so the FK is straightforward.

CREATE TABLE classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id),
  name        TEXT NOT NULL,
  grade_level TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- A class may have multiple teachers; a teacher may teach multiple classes.
CREATE TABLE class_teachers (
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (class_id, teacher_id)
);

CREATE INDEX class_teachers_teacher_idx ON class_teachers (teacher_id);

-- Helper: is the current user a teacher of this class?
-- SECURITY DEFINER so it bypasses RLS and never recurses through students.
CREATE OR REPLACE FUNCTION is_class_teacher(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_teachers
    WHERE class_id = p_class_id
      AND teacher_id = auth.uid()
  );
$$;
