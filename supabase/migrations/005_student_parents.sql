-- Migration 005: student_parents — many-to-many between students and parent emails.
-- A student may have N parent emails. A parent_user_id is filled in once a user
-- signs up with that email (via resolve_user_role_for_signup or refresh_my_role).

CREATE TABLE student_parents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_email    TEXT NOT NULL,
  parent_name     TEXT,
  parent_phone    TEXT,
  parent_user_id  UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, parent_email)
);

CREATE INDEX student_parents_email_idx ON student_parents (lower(parent_email));
CREATE INDEX student_parents_user_idx  ON student_parents (parent_user_id);

-- Always store emails lowercased
CREATE OR REPLACE FUNCTION lowercase_student_parent_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.parent_email := lower(NEW.parent_email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sp_lower_email
  BEFORE INSERT OR UPDATE ON student_parents
  FOR EACH ROW EXECUTE FUNCTION lowercase_student_parent_email();
