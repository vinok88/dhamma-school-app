-- Migration 001: schools

CREATE TABLE schools (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  location   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schools (name, location)
VALUES ('Jethawanaya Dhamma School', 'Melbourne, VIC');
