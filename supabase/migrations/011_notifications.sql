-- Migration 011: notifications

CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  type          TEXT,
  reference_id  UUID,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
