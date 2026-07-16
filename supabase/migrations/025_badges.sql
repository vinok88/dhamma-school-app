-- Migration 025: badge definitions.
--
-- Two scopes, distinguished by class_id:
--   class_id IS NULL  → school-wide badge (managed by principal/admin)
--   class_id set       → class-wide badge (managed by the class's teacher)
-- Badge images live in the public `badge-images` bucket (see 026).

CREATE TABLE IF NOT EXISTS badges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES schools(id),
  class_id     UUID REFERENCES classes(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  image_url    TEXT,                       -- storage path in badge-images
  created_by   UUID REFERENCES user_profiles(id),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS badges_school_idx ON badges (school_id, is_active);
CREATE INDEX IF NOT EXISTS badges_class_idx  ON badges (class_id);

DROP TRIGGER IF EXISTS set_badges_updated_at ON badges;
CREATE TRIGGER set_badges_updated_at
  BEFORE UPDATE ON badges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Read: any non-guest (badge definitions are non-sensitive; parents need names/art).
DROP POLICY IF EXISTS "Badges: authenticated read" ON badges;
CREATE POLICY "Badges: authenticated read"
  ON badges FOR SELECT
  TO authenticated
  USING (NOT is_guest());

-- Admin/principal manage everything.
DROP POLICY IF EXISTS "Badges: admin all" ON badges;
CREATE POLICY "Badges: admin all"
  ON badges FOR ALL
  TO authenticated
  USING (is_admin_or_principal())
  WITH CHECK (is_admin_or_principal());

-- Teachers manage class-wide badges for their own classes only.
DROP POLICY IF EXISTS "Badges: teacher manage class" ON badges;
CREATE POLICY "Badges: teacher manage class"
  ON badges FOR ALL
  TO authenticated
  USING (
    get_my_role() = 'teacher'
    AND class_id IS NOT NULL
    AND class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
  )
  WITH CHECK (
    get_my_role() = 'teacher'
    AND class_id IS NOT NULL
    AND class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
  );
