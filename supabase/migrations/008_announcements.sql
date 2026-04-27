-- Migration 008: announcements

CREATE TYPE announcement_type AS ENUM ('school', 'class', 'emergency', 'event_reminder');

CREATE TABLE announcements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES schools(id),
  author_id         UUID NOT NULL REFERENCES user_profiles(id),
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  type              announcement_type NOT NULL DEFAULT 'school',
  target_class_id   UUID REFERENCES classes(id),
  published_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
