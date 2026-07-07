-- Migration 018: Human-readable student IDs (per-school).
--
-- Each school carries a thin config: a prefix (e.g. 'SUN') and a running counter.
-- A student gets a display_id like 'SUN-00042' the moment it first becomes
-- active/approved. Numbering is per-school (each school counts from 00001).
--
-- The ID is shared by a guardian so another guardian can link to the same child
-- (see 019_link_student_by_code.sql).

-- ── Per-school config ────────────────────────────────────────────────────────
ALTER TABLE schools ADD COLUMN IF NOT EXISTS student_id_prefix TEXT NOT NULL DEFAULT 'SUN';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS student_id_seq    INT  NOT NULL DEFAULT 0;

-- Prefixes must be distinct so display_id is globally unique across schools.
DO $$ BEGIN
  ALTER TABLE schools ADD CONSTRAINT schools_student_id_prefix_key UNIQUE (student_id_prefix);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── display_id on students ───────────────────────────────────────────────────
ALTER TABLE students ADD COLUMN IF NOT EXISTS display_id TEXT;
DO $$ BEGIN
  ALTER TABLE students ADD CONSTRAINT students_display_id_key UNIQUE (display_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Generator: atomically bump the school counter and format the ID ──────────
-- The UPDATE row lock serialises concurrent inserts for the same school, so no
-- extra locking is required.
CREATE OR REPLACE FUNCTION gen_student_display_id(p_school_id UUID)
RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  v_prefix TEXT;
  v_n      INT;
BEGIN
  UPDATE schools
     SET student_id_seq = student_id_seq + 1
   WHERE id = p_school_id
   RETURNING student_id_prefix, student_id_seq INTO v_prefix, v_n;

  IF v_n IS NULL THEN
    RAISE EXCEPTION 'Unknown school % for display_id generation', p_school_id;
  END IF;

  RETURN COALESCE(v_prefix, 'SUN') || '-' || lpad(v_n::text, 5, '0');
END $$;

-- ── Assign on first transition to active/approved ────────────────────────────
CREATE OR REPLACE FUNCTION assign_student_display_id()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.display_id IS NULL AND NEW.status IN ('active', 'approved') THEN
    NEW.display_id := gen_student_display_id(NEW.school_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS students_assign_display_id ON students;
CREATE TRIGGER students_assign_display_id
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION assign_student_display_id();

-- ── Backfill existing active/approved students, per school, in created order ──
DO $$
DECLARE
  v_school RECORD;
  v_row    RECORD;
BEGIN
  FOR v_school IN SELECT id FROM schools LOOP
    FOR v_row IN
      SELECT id FROM students
       WHERE school_id = v_school.id
         AND display_id IS NULL
         AND status IN ('active', 'approved')
       ORDER BY created_at, id
    LOOP
      UPDATE students
         SET display_id = gen_student_display_id(v_school.id)
       WHERE id = v_row.id;
    END LOOP;
  END LOOP;
END $$;
