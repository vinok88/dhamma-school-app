-- Migration 009: events

CREATE TYPE event_type AS ENUM ('poya', 'sermon', 'exam', 'holiday', 'special');

CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id),
  title           TEXT NOT NULL,
  description     TEXT,
  event_type      event_type NOT NULL DEFAULT 'special',
  start_datetime  TIMESTAMPTZ NOT NULL,
  end_datetime    TIMESTAMPTZ,
  location        TEXT,
  created_by      UUID NOT NULL REFERENCES user_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
