-- Migration 006: teacher_invitations — principal whitelists an email.
-- When a user signs up with that email they automatically get teacher role.

CREATE TABLE teacher_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  phone       TEXT,
  address     TEXT,
  invited_by  UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  claimed_by  UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX teacher_invitations_email_idx ON teacher_invitations (lower(email));

CREATE OR REPLACE FUNCTION lowercase_teacher_invitation_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email := lower(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ti_lower_email
  BEFORE INSERT OR UPDATE ON teacher_invitations
  FOR EACH ROW EXECUTE FUNCTION lowercase_teacher_invitation_email();
