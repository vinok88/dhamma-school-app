-- Migration 019: Second-guardian linking via the readable student ID.
--
-- A guardian shares the child's display_id (e.g. 'SUN-00042'). Another guardian
-- links instantly by entering that ID plus a verification factor (the child's
-- last name + date of birth) — the ID alone is guessable, so the extra factor
-- blocks blind enumeration. Attempts are rate-limited.
--
-- Parents have no INSERT permission on student_parents / notifications, so this
-- runs as SECURITY DEFINER (same trusted pattern as request_add_student).

-- ── Rate-limit log ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_link_attempts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  succeeded  BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS student_link_attempts_user_idx
  ON student_link_attempts (user_id, created_at);

ALTER TABLE student_link_attempts ENABLE ROW LEVEL SECURITY;
-- Written only by the SECURITY DEFINER function below; admins may inspect.
DROP POLICY IF EXISTS "LinkAttempts: admin read" ON student_link_attempts;
CREATE POLICY "LinkAttempts: admin read"
  ON student_link_attempts FOR SELECT
  TO authenticated
  USING (is_admin_or_principal());

-- ── The link RPC ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION link_student_by_code(
  p_display_id        TEXT,
  p_verify_last_name  TEXT,
  p_verify_dob        DATE
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_role       user_role;
  v_full_name  TEXT;
  v_phone      TEXT;
  v_email      TEXT;
  v_student    students%ROWTYPE;
  v_fail_count INT;
  v_recipient  UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role, full_name, phone
    INTO v_role, v_full_name, v_phone
    FROM user_profiles WHERE id = v_uid;

  IF v_role IS NULL OR v_role = 'guest' THEN
    RAISE EXCEPTION 'Only registered users can link to a child';
  END IF;

  -- Rate limit: at most 5 failed attempts per hour per user.
  SELECT count(*) INTO v_fail_count
    FROM student_link_attempts
   WHERE user_id = v_uid
     AND NOT succeeded
     AND created_at > now() - interval '1 hour';
  IF v_fail_count >= 5 THEN
    RAISE EXCEPTION 'Too many attempts. Please try again later.';
  END IF;

  -- Match on ID + verification factor; only enrolled (active/approved) students.
  SELECT * INTO v_student
    FROM students
   WHERE upper(display_id) = upper(btrim(p_display_id))
     AND lower(last_name)  = lower(btrim(p_verify_last_name))
     AND dob = p_verify_dob
     AND status IN ('active', 'approved')
   LIMIT 1;

  IF v_student.id IS NULL THEN
    INSERT INTO student_link_attempts (user_id, succeeded) VALUES (v_uid, FALSE);
    -- Generic message — never confirm whether the ID exists.
    RAISE EXCEPTION 'No matching student found. Check the Student ID, last name and date of birth.';
  END IF;

  INSERT INTO student_link_attempts (user_id, succeeded) VALUES (v_uid, TRUE);

  -- Already linked? Idempotent no-op, no notification spam.
  IF EXISTS (
    SELECT 1 FROM student_parents
     WHERE student_id = v_student.id AND parent_user_id = v_uid
  ) THEN
    RETURN v_student.id;
  END IF;

  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_uid;

  -- Link the caller. If a row with this email already exists (e.g. principal
  -- pre-added it), claim it for this user.
  INSERT INTO student_parents (student_id, parent_email, parent_name, parent_phone, parent_user_id)
  VALUES (v_student.id, v_email, v_full_name, v_phone, v_uid)
  ON CONFLICT (student_id, parent_email)
    DO UPDATE SET parent_user_id = EXCLUDED.parent_user_id;

  -- Notify principals/admins and the other linked guardians.
  FOR v_recipient IN
    SELECT id FROM user_profiles WHERE role IN ('principal', 'admin')
    UNION
    SELECT parent_user_id FROM student_parents
     WHERE student_id = v_student.id
       AND parent_user_id IS NOT NULL
       AND parent_user_id <> v_uid
  LOOP
    INSERT INTO notifications (user_id, title, body, type, reference_id)
    VALUES (
      v_recipient,
      'New guardian linked',
      COALESCE(v_full_name, 'A parent') || ' is now linked to '
        || v_student.first_name || ' ' || v_student.last_name || ' as a guardian.',
      'student_link',
      v_student.id
    );
  END LOOP;

  RETURN v_student.id;
END $$;

GRANT EXECUTE ON FUNCTION link_student_by_code(TEXT, TEXT, DATE) TO authenticated;
