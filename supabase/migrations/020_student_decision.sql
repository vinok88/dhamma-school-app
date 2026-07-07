-- Migration 020: Principal approve / reject of a pending student, with parent
-- notification.
--
-- The students UPDATE itself is allowed for admin/principal under RLS, but
-- notifications inserts are service-role-only — so these run as SECURITY DEFINER
-- (same trusted pattern as request_add_student / link_student_by_code). Doing the
-- status change and the notification in one function keeps them atomic.
--
-- Only guardians who have signed up (parent_user_id set) get an in-app
-- notification; others see the new status on next login.

CREATE OR REPLACE FUNCTION approve_student(p_student_id UUID, p_class_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_student    students%ROWTYPE;
  v_class_name TEXT;
  v_recipient  UUID;
BEGIN
  IF NOT is_admin_or_principal() THEN
    RAISE EXCEPTION 'Only a principal or admin can approve a student';
  END IF;

  SELECT name INTO v_class_name FROM classes WHERE id = p_class_id;
  IF v_class_name IS NULL THEN
    RAISE EXCEPTION 'Class not found';
  END IF;

  -- Sets class + active together (satisfies active_requires_class) and the
  -- assign_student_display_id trigger stamps the readable ID on activation.
  UPDATE students
     SET class_id = p_class_id, status = 'active', updated_at = now()
   WHERE id = p_student_id
   RETURNING * INTO v_student;
  IF v_student.id IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  FOR v_recipient IN
    SELECT parent_user_id FROM student_parents
     WHERE student_id = p_student_id AND parent_user_id IS NOT NULL
  LOOP
    INSERT INTO notifications (user_id, title, body, type, reference_id)
    VALUES (
      v_recipient,
      'Registration approved',
      v_student.first_name || ' ' || v_student.last_name
        || ' has been approved and assigned to ' || v_class_name || '.',
      'student_registration',
      p_student_id
    );
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION approve_student(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION reject_student(p_student_id UUID, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_student   students%ROWTYPE;
  v_reason    TEXT := NULLIF(btrim(COALESCE(p_reason, '')), '');
  v_recipient UUID;
BEGIN
  IF NOT is_admin_or_principal() THEN
    RAISE EXCEPTION 'Only a principal or admin can reject a student';
  END IF;

  UPDATE students
     SET status = 'rejected', status_note = v_reason, updated_at = now()
   WHERE id = p_student_id
   RETURNING * INTO v_student;
  IF v_student.id IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  FOR v_recipient IN
    SELECT parent_user_id FROM student_parents
     WHERE student_id = p_student_id AND parent_user_id IS NOT NULL
  LOOP
    INSERT INTO notifications (user_id, title, body, type, reference_id)
    VALUES (
      v_recipient,
      'Registration update',
      v_student.first_name || ' ' || v_student.last_name
        || '''s registration was not approved.'
        || CASE WHEN v_reason IS NOT NULL THEN ' Reason: ' || v_reason ELSE '' END,
      'student_registration',
      p_student_id
    );
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION reject_student(UUID, TEXT) TO authenticated;
