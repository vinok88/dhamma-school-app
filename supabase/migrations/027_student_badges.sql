-- Migration 027: badge awards + award/revoke RPCs.
--
-- Repeat awards are allowed (each award is its own row). An award is "active"
-- while: revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now()).
--
-- Writes go through SECURITY DEFINER RPCs (same pattern as approve_student /
-- award requires a teacher-scope check plus a parent notification, and
-- notifications are service-role-only).

CREATE TABLE IF NOT EXISTS student_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id    UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_by  UUID REFERENCES user_profiles(id),
  note        TEXT,
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,                 -- NULL = permanent
  revoked_at  TIMESTAMPTZ,                 -- NULL = not revoked
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_badges_student_idx ON student_badges (student_id);
CREATE INDEX IF NOT EXISTS student_badges_badge_idx   ON student_badges (badge_id);

ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

-- Admin/principal read all.
DROP POLICY IF EXISTS "StudentBadges: admin read" ON student_badges;
CREATE POLICY "StudentBadges: admin read"
  ON student_badges FOR SELECT
  TO authenticated
  USING (is_admin_or_principal());

-- Teacher reads awards for students in their classes (helper is SECURITY DEFINER).
DROP POLICY IF EXISTS "StudentBadges: teacher read class" ON student_badges;
CREATE POLICY "StudentBadges: teacher read class"
  ON student_badges FOR SELECT
  TO authenticated
  USING (student_id IN (SELECT my_class_student_ids()));

-- Parent reads awards for their own children.
DROP POLICY IF EXISTS "StudentBadges: parent read own" ON student_badges;
CREATE POLICY "StudentBadges: parent read own"
  ON student_badges FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT sp.student_id FROM student_parents sp WHERE sp.parent_user_id = auth.uid()
    )
  );

-- Writes happen only via the RPCs below (SECURITY DEFINER) — no direct policies.

-- ── Award ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION award_badge(
  p_student_id UUID,
  p_badge_id   UUID,
  p_expires_at TIMESTAMPTZ,
  p_note       TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_role      user_role;
  v_badge     badges%ROWTYPE;
  v_student   students%ROWTYPE;
  v_award_id  UUID;
  v_recipient UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT role INTO v_role FROM user_profiles WHERE id = v_uid;

  SELECT * INTO v_badge FROM badges WHERE id = p_badge_id AND is_active;
  IF v_badge.id IS NULL THEN RAISE EXCEPTION 'Badge not found'; END IF;

  SELECT * INTO v_student FROM students WHERE id = p_student_id;
  IF v_student.id IS NULL THEN RAISE EXCEPTION 'Student not found'; END IF;

  IF is_admin_or_principal() THEN
    NULL; -- may award any badge to any student
  ELSIF v_role = 'teacher' THEN
    -- Must teach the student's class.
    IF NOT EXISTS (
      SELECT 1 FROM class_teachers ct
      WHERE ct.teacher_id = v_uid AND ct.class_id = v_student.class_id
    ) THEN
      RAISE EXCEPTION 'You can only award badges to students in your classes';
    END IF;
    -- Class-wide badge: must be the teacher's class AND the student must be in it.
    IF v_badge.class_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM class_teachers ct
        WHERE ct.teacher_id = v_uid AND ct.class_id = v_badge.class_id
      ) THEN
        RAISE EXCEPTION 'You can only award school-wide or your own class badges';
      END IF;
      IF v_student.class_id IS DISTINCT FROM v_badge.class_id THEN
        RAISE EXCEPTION 'This class badge can only be given to students in that class';
      END IF;
    END IF;
  ELSE
    RAISE EXCEPTION 'Not allowed to award badges';
  END IF;

  IF p_expires_at IS NOT NULL AND p_expires_at <= now() THEN
    RAISE EXCEPTION 'Expiry date must be in the future';
  END IF;

  INSERT INTO student_badges (student_id, badge_id, awarded_by, note, expires_at)
  VALUES (p_student_id, p_badge_id, v_uid, NULLIF(btrim(COALESCE(p_note, '')), ''), p_expires_at)
  RETURNING id INTO v_award_id;

  -- Notify the child's linked parents.
  FOR v_recipient IN
    SELECT parent_user_id FROM student_parents
     WHERE student_id = p_student_id AND parent_user_id IS NOT NULL
  LOOP
    INSERT INTO notifications (user_id, title, body, type, reference_id)
    VALUES (
      v_recipient,
      'New badge earned 🏅',
      v_student.first_name || ' ' || v_student.last_name
        || ' earned the "' || v_badge.name || '" badge.',
      'badge',
      v_award_id
    );
  END LOOP;

  RETURN v_award_id;
END $$;

GRANT EXECUTE ON FUNCTION award_badge(UUID, UUID, TIMESTAMPTZ, TEXT) TO authenticated;

-- ── Revoke ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION revoke_badge(p_award_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid          UUID := auth.uid();
  v_award        student_badges%ROWTYPE;
  v_student_class UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO v_award FROM student_badges WHERE id = p_award_id;
  IF v_award.id IS NULL THEN RAISE EXCEPTION 'Award not found'; END IF;

  IF is_admin_or_principal() THEN
    NULL;
  ELSIF get_my_role() = 'teacher' THEN
    SELECT class_id INTO v_student_class FROM students WHERE id = v_award.student_id;
    IF NOT EXISTS (
      SELECT 1 FROM class_teachers WHERE teacher_id = v_uid AND class_id = v_student_class
    ) THEN
      RAISE EXCEPTION 'You can only revoke badges for students in your classes';
    END IF;
  ELSE
    RAISE EXCEPTION 'Not allowed to revoke badges';
  END IF;

  UPDATE student_badges SET revoked_at = now() WHERE id = p_award_id AND revoked_at IS NULL;
END $$;

GRANT EXECUTE ON FUNCTION revoke_badge(UUID) TO authenticated;
