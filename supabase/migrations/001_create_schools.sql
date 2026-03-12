-- Migration 001: Create schools table
-- Idempotent: safe to run multiple times

CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schools (name, location)
VALUES ('Mahamevnawa Dhamma School – Southbank', 'Melbourne, VIC')
ON CONFLICT DO NOTHING;
