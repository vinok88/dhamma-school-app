-- Migration 006: Create announcements table
-- Idempotent: safe to run multiple times

DO $$ BEGIN
  CREATE TYPE announcement_type AS ENUM (
    'school',
    'class',
    'emergency',
    'event_reminder'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  author_id UUID NOT NULL REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type announcement_type NOT NULL DEFAULT 'school',
  target_class_id UUID REFERENCES classes(id),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
