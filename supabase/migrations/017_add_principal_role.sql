-- Migration 017: Add 'principal' role
-- Principal has same DB-level access as admin

-- ============================================================
-- 1. Extend the user_role enum
-- ============================================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'principal';

-- ============================================================
-- 2. Helper function: checks if current user is admin or principal
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin_or_principal()
RETURNS BOOLEAN AS $$
  SELECT role::text IN ('admin', 'principal') FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 3. Update RLS policies to include principal
-- ============================================================

-- USER_PROFILES: admin/principal can read all
DROP POLICY IF EXISTS "Profiles: admin read all" ON user_profiles;
CREATE POLICY "Profiles: admin read all"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin_or_principal());

-- USER_PROFILES: admin/principal can update all
DROP POLICY IF EXISTS "Profiles: admin update all" ON user_profiles;
CREATE POLICY "Profiles: admin update all"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin_or_principal())
  WITH CHECK (is_admin_or_principal());

-- STUDENTS: admin/principal full access
DROP POLICY IF EXISTS "Students: admin all" ON students;
CREATE POLICY "Students: admin all"
  ON students FOR ALL
  TO authenticated
  USING (is_admin_or_principal());

-- CLASSES: teacher sees own OR admin/principal
DROP POLICY IF EXISTS "Classes: teacher sees own" ON classes;
CREATE POLICY "Classes: teacher sees own"
  ON classes FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR is_admin_or_principal()
  );

-- CLASSES: admin/principal full access
DROP POLICY IF EXISTS "Classes: admin all" ON classes;
CREATE POLICY "Classes: admin all"
  ON classes FOR ALL
  TO authenticated
  USING (is_admin_or_principal());

-- ATTENDANCE: admin/principal full access
DROP POLICY IF EXISTS "Attendance: admin all" ON attendance_records;
CREATE POLICY "Attendance: admin all"
  ON attendance_records FOR ALL
  TO authenticated
  USING (is_admin_or_principal());

-- ANNOUNCEMENTS: class-targeted readable by admin/principal
DROP POLICY IF EXISTS "Announcements: authenticated read" ON announcements;
CREATE POLICY "Announcements: authenticated read"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    type IN ('school', 'emergency', 'event_reminder')
    OR
    (
      type = 'class'
      AND (
        is_admin_or_principal()
        OR author_id = auth.uid()
        OR target_class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
        OR target_class_id IN (SELECT class_id FROM students WHERE parent_id = auth.uid())
      )
    )
  );

-- ANNOUNCEMENTS: admin/principal full access
DROP POLICY IF EXISTS "Announcements: admin all" ON announcements;
CREATE POLICY "Announcements: admin all"
  ON announcements FOR ALL
  TO authenticated
  USING (is_admin_or_principal());

-- EVENTS: admin/principal full access
DROP POLICY IF EXISTS "Events: admin all" ON events;
CREATE POLICY "Events: admin all"
  ON events FOR ALL
  TO authenticated
  USING (is_admin_or_principal());

-- MESSAGES: admin/principal can read all
DROP POLICY IF EXISTS "Messages: admin read all" ON messages;
CREATE POLICY "Messages: admin read all"
  ON messages FOR SELECT
  TO authenticated
  USING (is_admin_or_principal());
