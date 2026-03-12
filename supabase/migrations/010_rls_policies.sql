-- Migration 010: Row-Level Security (RLS) policies for all tables
-- Idempotent: uses DROP POLICY IF EXISTS before CREATE

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: get current user's role
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- SCHOOLS: all authenticated users can read
-- ============================================================
DROP POLICY IF EXISTS "Schools: authenticated read" ON schools;
CREATE POLICY "Schools: authenticated read"
  ON schools FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- USER_PROFILES
-- ============================================================
DROP POLICY IF EXISTS "Profiles: own read/write" ON user_profiles;
CREATE POLICY "Profiles: own read/write"
  ON user_profiles FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Profiles: admin read all" ON user_profiles;
CREATE POLICY "Profiles: admin read all"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (get_my_role() = 'admin');

-- Teacher can read profiles of parents in their class (for messaging)
DROP POLICY IF EXISTS "Profiles: teacher read parent profiles" ON user_profiles;
CREATE POLICY "Profiles: teacher read parent profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'teacher'
    AND role = 'parent'
  );

-- ============================================================
-- STUDENTS
-- ============================================================
-- Parent sees own children
DROP POLICY IF EXISTS "Students: parent sees own" ON students;
CREATE POLICY "Students: parent sees own"
  ON students FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

-- Parent can insert their own students
DROP POLICY IF EXISTS "Students: parent insert" ON students;
CREATE POLICY "Students: parent insert"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid() AND get_my_role() = 'parent');

-- Parent can update their own pending/rejected students
DROP POLICY IF EXISTS "Students: parent update own" ON students;
CREATE POLICY "Students: parent update own"
  ON students FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid() AND status IN ('pending', 'rejected'))
  WITH CHECK (parent_id = auth.uid());

-- Teacher sees students in their assigned class
DROP POLICY IF EXISTS "Students: teacher sees class" ON students;
CREATE POLICY "Students: teacher sees class"
  ON students FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'teacher'
    AND class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

-- Admin sees all students
DROP POLICY IF EXISTS "Students: admin all" ON students;
CREATE POLICY "Students: admin all"
  ON students FOR ALL
  TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- CLASSES
-- ============================================================
-- Teacher sees their own class
DROP POLICY IF EXISTS "Classes: teacher sees own" ON classes;
CREATE POLICY "Classes: teacher sees own"
  ON classes FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR get_my_role() = 'admin'
  );

-- Admin full access
DROP POLICY IF EXISTS "Classes: admin all" ON classes;
CREATE POLICY "Classes: admin all"
  ON classes FOR ALL
  TO authenticated
  USING (get_my_role() = 'admin');

-- All authenticated users can read classes (for calendar, etc.)
DROP POLICY IF EXISTS "Classes: authenticated read" ON classes;
CREATE POLICY "Classes: authenticated read"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- ATTENDANCE_RECORDS
-- ============================================================
-- Teacher can insert/update for their class
DROP POLICY IF EXISTS "Attendance: teacher insert" ON attendance_records;
CREATE POLICY "Attendance: teacher insert"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND get_my_role() = 'teacher'
    AND class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "Attendance: teacher update" ON attendance_records;
CREATE POLICY "Attendance: teacher update"
  ON attendance_records FOR UPDATE
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND get_my_role() = 'teacher'
  );

-- Parent can read their child's attendance
DROP POLICY IF EXISTS "Attendance: parent read own child" ON attendance_records;
CREATE POLICY "Attendance: parent read own child"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Teacher can read attendance for their class
DROP POLICY IF EXISTS "Attendance: teacher read class" ON attendance_records;
CREATE POLICY "Attendance: teacher read class"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'teacher'
    AND class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

-- Admin full access
DROP POLICY IF EXISTS "Attendance: admin all" ON attendance_records;
CREATE POLICY "Attendance: admin all"
  ON attendance_records FOR ALL
  TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
-- All authenticated users can read
DROP POLICY IF EXISTS "Announcements: authenticated read" ON announcements;
CREATE POLICY "Announcements: authenticated read"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    -- School-wide and emergency: everyone
    type IN ('school', 'emergency', 'event_reminder')
    OR
    -- Class-targeted: parents of students in class OR the class teacher OR admin
    (
      type = 'class'
      AND (
        get_my_role() = 'admin'
        OR author_id = auth.uid()
        OR target_class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
        OR target_class_id IN (SELECT class_id FROM students WHERE parent_id = auth.uid())
      )
    )
  );

-- Teacher can insert class-scoped announcements
DROP POLICY IF EXISTS "Announcements: teacher insert class" ON announcements;
CREATE POLICY "Announcements: teacher insert class"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_role() = 'teacher'
    AND type = 'class'
    AND author_id = auth.uid()
    AND target_class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

-- Admin can insert any announcement
DROP POLICY IF EXISTS "Announcements: admin all" ON announcements;
CREATE POLICY "Announcements: admin all"
  ON announcements FOR ALL
  TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- EVENTS
-- ============================================================
-- All authenticated users can read
DROP POLICY IF EXISTS "Events: authenticated read" ON events;
CREATE POLICY "Events: authenticated read"
  ON events FOR SELECT
  TO authenticated
  USING (true);

-- Admin full access
DROP POLICY IF EXISTS "Events: admin all" ON events;
CREATE POLICY "Events: admin all"
  ON events FOR ALL
  TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- MESSAGES
-- ============================================================
-- Sender and recipient can read their thread
DROP POLICY IF EXISTS "Messages: participant read" ON messages;
CREATE POLICY "Messages: participant read"
  ON messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

-- Users can insert messages (parent-to-parent prevention enforced by app layer)
-- TODO: Add a Postgres function/trigger to enforce parent-to-parent restriction at DB level
DROP POLICY IF EXISTS "Messages: sender insert" ON messages;
CREATE POLICY "Messages: sender insert"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    -- Parents cannot send to other parents
    AND NOT (
      get_my_role() = 'parent'
      AND (SELECT role FROM user_profiles WHERE id = recipient_id) = 'parent'
    )
  );

-- Sender can update (e.g., retract) — recipient can update read_at
DROP POLICY IF EXISTS "Messages: participant update" ON messages;
CREATE POLICY "Messages: participant update"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Admin can read all messages
DROP POLICY IF EXISTS "Messages: admin read all" ON messages;
CREATE POLICY "Messages: admin read all"
  ON messages FOR SELECT
  TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
-- Users can only read their own notifications
DROP POLICY IF EXISTS "Notifications: own read" ON notifications;
CREATE POLICY "Notifications: own read"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own (mark read)
DROP POLICY IF EXISTS "Notifications: own update" ON notifications;
CREATE POLICY "Notifications: own update"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- System (service role) can insert — users cannot self-insert
-- Inserts are done via Edge Functions or admin service role only
