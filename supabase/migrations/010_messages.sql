-- Migration 010: messages

CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES schools(id),
  sender_id     UUID NOT NULL REFERENCES user_profiles(id),
  recipient_id  UUID NOT NULL REFERENCES user_profiles(id),
  body          TEXT NOT NULL,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
