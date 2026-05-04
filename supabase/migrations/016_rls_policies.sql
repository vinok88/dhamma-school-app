-- Migration 016: Row-Level Security across all tables.
--
-- Roles:
--   admin, principal — full access (via is_admin_or_principal())
--   teacher          — sees their class + linked students/attendance
--   parent           — sees students they are linked to via student_parents
--   guest            — no access to any data table

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE schools              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teachers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE students             ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_invitations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SCHOOLS — readable by all authenticated users
-- ============================================================
CREATE POLICY "Schools: authenticated read"
  ON schools FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- USER_PROFILES
-- ============================================================
CREATE POLICY "Profiles: own read/write"
  ON user_profiles FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles: admin read all"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin_or_principal());

CREATE POLICY "Profiles: admin update all"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin_or_principal())
  WITH CHECK (is_admin_or_principal());

CREATE POLICY "Profiles: teacher read parent profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (get_my_role() = 'teacher' AND role = 'parent');

-- ============================================================
-- CLASSES
-- ============================================================
CREATE POLICY "Classes: authenticated read"
  ON classes FOR SELECT
  TO authenticated
  USING (NOT is_guest());

CREATE POLICY "Classes: admin all"
  ON classes FOR ALL
  TO authenticated
  USING (is_admin_or_principal())
  WITH CHECK (is_admin_or_principal());

-- ============================================================
-- CLASS_TEACHERS — read for non-guests; admin manages.
-- ============================================================
CREATE POLICY "ClassTeachers: authenticated read"
  ON class_teachers FOR SELECT
  TO authenticated
  USING (NOT is_guest());

CREATE POLICY "ClassTeachers: admin all"
  ON class_teachers FOR ALL
  TO authenticated
  USING (is_admin_or_principal())
  WITH CHECK (is_admin_or_principal());

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE POLICY "Students: parent sees linked"
  ON students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_parents sp
      WHERE sp.student_id = students.id
        AND sp.parent_user_id = auth.uid()
    )
  );

-- Parent linked via student_parents may edit the student row.
-- Column-level scoping (only safe fields) is enforced at the application layer.
CREATE POLICY "Students: parent update linked"
  ON students FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_parents sp
      WHERE sp.student_id = students.id
        AND sp.parent_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_parents sp
      WHERE sp.student_id = students.id
        AND sp.parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Students: teacher sees class"
  ON students FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'teacher'
    AND class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
  );

CREATE POLICY "Students: admin all"
  ON students FOR ALL
  TO authenticated
  USING (is_admin_or_principal())
  WITH CHECK (is_admin_or_principal());

-- ============================================================
-- STUDENT_PARENTS
-- ============================================================

-- SECURITY DEFINER helper bypasses RLS so the policy below doesn't recurse
-- back into the students/student_parents policies.
CREATE OR REPLACE FUNCTION my_class_student_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT s.id FROM students s
  WHERE s.class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid());
$$;

CREATE POLICY "StudentParents: admin all"
  ON student_parents FOR ALL
  TO authenticated
  USING (is_admin_or_principal())
  WITH CHECK (is_admin_or_principal());

CREATE POLICY "StudentParents: parent read own"
  ON student_parents FOR SELECT
  TO authenticated
  USING (parent_user_id = auth.uid());

CREATE POLICY "StudentParents: teacher read class"
  ON student_parents FOR SELECT
  TO authenticated
  USING (student_id IN (SELECT my_class_student_ids()));

-- ============================================================
-- TEACHER_INVITATIONS — admin/principal only
-- ============================================================
CREATE POLICY "TeacherInvitations: admin all"
  ON teacher_invitations FOR ALL
  TO authenticated
  USING (is_admin_or_principal())
  WITH CHECK (is_admin_or_principal());

-- ============================================================
-- ATTENDANCE_RECORDS
-- ============================================================
CREATE POLICY "Attendance: teacher insert"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND get_my_role() = 'teacher'
    AND class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
  );

CREATE POLICY "Attendance: teacher update"
  ON attendance_records FOR UPDATE
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND get_my_role() = 'teacher'
  );

-- Teachers can delete their own attendance records (used by "Undo Check-In",
-- which removes the row entirely so the slate is clean).
CREATE POLICY "Attendance: teacher delete"
  ON attendance_records FOR DELETE
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND get_my_role() = 'teacher'
  );

CREATE POLICY "Attendance: teacher read class"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'teacher'
    AND class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
  );

CREATE POLICY "Attendance: parent read own child"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT sp.student_id FROM student_parents sp
      WHERE sp.parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Attendance: admin all"
  ON attendance_records FOR ALL
  TO authenticated
  USING (is_admin_or_principal())
  WITH CHECK (is_admin_or_principal());

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE POLICY "Announcements: authenticated read"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    NOT is_guest()
    AND (
      type IN ('school', 'emergency', 'event_reminder')
      OR (
        type = 'class'
        AND (
          is_admin_or_principal()
          OR author_id = auth.uid()
          OR target_class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
          OR target_class_id IN (
            SELECT s.class_id FROM students s
            JOIN student_parents sp ON sp.student_id = s.id
            WHERE sp.parent_user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Announcements: teacher insert class"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_role() = 'teacher'
    AND type = 'class'
    AND author_id = auth.uid()
    AND target_class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
  );

CREATE POLICY "Announcements: admin all"
  ON announcements FOR ALL
  TO authenticated
  USING (is_admin_or_principal())
  WITH CHECK (is_admin_or_principal());

-- ============================================================
-- EVENTS
-- ============================================================
CREATE POLICY "Events: authenticated read"
  ON events FOR SELECT
  TO authenticated
  USING (NOT is_guest());

CREATE POLICY "Events: admin all"
  ON events FOR ALL
  TO authenticated
  USING (is_admin_or_principal())
  WITH CHECK (is_admin_or_principal());

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE POLICY "Messages: participant read"
  ON messages FOR SELECT
  TO authenticated
  USING (
    NOT is_guest()
    AND (sender_id = auth.uid() OR recipient_id = auth.uid())
  );

CREATE POLICY "Messages: sender insert"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT is_guest()
    AND sender_id = auth.uid()
    -- Parents cannot DM other parents
    AND NOT (
      get_my_role() = 'parent'
      AND (SELECT role FROM user_profiles WHERE id = recipient_id) = 'parent'
    )
  );

CREATE POLICY "Messages: participant update"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Messages: admin read all"
  ON messages FOR SELECT
  TO authenticated
  USING (is_admin_or_principal());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "Notifications: own read"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND NOT is_guest());

CREATE POLICY "Notifications: own update"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Notifications: own delete"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Inserts on notifications happen via Edge Functions / service role only.

-- ============================================================
-- AUDIT_LOGS — admin / principal read only
-- ============================================================
CREATE POLICY "Audit: admin read"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin_or_principal());
