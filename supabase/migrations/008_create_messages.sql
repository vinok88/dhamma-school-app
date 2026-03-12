-- Migration 008: Create messages table
-- Idempotent: safe to run multiple times

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  sender_id UUID NOT NULL REFERENCES user_profiles(id),
  recipient_id UUID NOT NULL REFERENCES user_profiles(id),
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent parent-to-parent messaging via a check on sender/recipient roles
-- Full enforcement is done via RLS policies in migration 010
-- The application layer also validates this before sending
