-- Migration 002: user_profiles + role/status enums + helper functions

CREATE TYPE user_role AS ENUM ('parent', 'teacher', 'admin', 'principal', 'guest');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');

CREATE TABLE user_profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id          UUID REFERENCES schools(id),
  full_name          TEXT,
  preferred_name     TEXT,
  phone              TEXT,
  address            TEXT,
  role               user_role   NOT NULL DEFAULT 'guest',
  status             user_status NOT NULL DEFAULT 'active',
  profile_photo_url  TEXT,
  fcm_token          TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Generic updated_at trigger function used by several tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper: current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin_or_principal()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role IN ('admin', 'principal') FROM user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_guest()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role = 'guest' FROM user_profiles WHERE id = auth.uid();
$$;
