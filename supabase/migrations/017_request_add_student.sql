-- Migration 017: Parent self-service "add my child" request.
--
-- Parents have no INSERT permission on students / student_parents / notifications
-- (see 016_rls_policies.sql). This SECURITY DEFINER RPC lets a registered parent
-- submit a new child for approval: it creates a `pending` student (no class yet —
-- the class is assigned by the principal on approval), links the requesting parent,
-- and drops an approval-request notification on every principal / admin.
--
-- Mirrors the SECURITY DEFINER pattern already used in 013_role_rpcs_and_triggers.sql.

CREATE OR REPLACE FUNCTION request_add_student(
  p_first_name             TEXT,
  p_last_name              TEXT,
  p_preferred_name         TEXT,
  p_dob                    DATE,
  p_gender                 TEXT,
  p_address                TEXT,
  p_has_allergies          BOOLEAN,
  p_allergy_notes          TEXT,
  p_photo_publish_consent  BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_email      TEXT;
  v_role       user_role;
  v_full_name  TEXT;
  v_phone      TEXT;
  v_school_id  UUID;
  v_student_id UUID;
  v_recipient  UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'request_add_student requires an authenticated user';
  END IF;

  IF btrim(COALESCE(p_first_name, '')) = '' OR btrim(COALESCE(p_last_name, '')) = '' THEN
    RAISE EXCEPTION 'First name and last name are required';
  END IF;
  IF p_dob IS NULL THEN
    RAISE EXCEPTION 'Date of birth is required';
  END IF;

  SELECT role, school_id, full_name, phone
    INTO v_role, v_school_id, v_full_name, v_phone
    FROM user_profiles
   WHERE id = v_uid;

  IF v_role IS NULL OR v_role = 'guest' THEN
    RAISE EXCEPTION 'Only registered users can add a child';
  END IF;

  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Could not resolve the account email';
  END IF;

  -- Single-school deployment fallback.
  IF v_school_id IS NULL THEN
    SELECT id INTO v_school_id FROM schools ORDER BY created_at LIMIT 1;
  END IF;

  -- Pending student — no class until the principal approves & assigns one.
  INSERT INTO students (
    school_id, first_name, last_name, preferred_name, dob, gender,
    address, has_allergies, allergy_notes, photo_publish_consent, status
  ) VALUES (
    v_school_id,
    btrim(p_first_name),
    btrim(p_last_name),
    NULLIF(btrim(COALESCE(p_preferred_name, '')), ''),
    p_dob,
    p_gender,
    NULLIF(btrim(COALESCE(p_address, '')), ''),
    COALESCE(p_has_allergies, FALSE),
    CASE WHEN COALESCE(p_has_allergies, FALSE)
         THEN NULLIF(btrim(COALESCE(p_allergy_notes, '')), '')
         ELSE NULL END,
    COALESCE(p_photo_publish_consent, FALSE),
    'pending'
  )
  RETURNING id INTO v_student_id;

  -- Link the requesting parent. The sp_upgrade_guest BEFORE-INSERT trigger also
  -- resolves parent_user_id from the email, but we set it explicitly so the link
  -- is immediate and unambiguous.
  INSERT INTO student_parents (student_id, parent_email, parent_name, parent_phone, parent_user_id)
  VALUES (v_student_id, v_email, v_full_name, v_phone, v_uid)
  ON CONFLICT (student_id, parent_email) DO NOTHING;

  -- Approval request → every principal / admin (notifications table is otherwise
  -- service-role-only; this definer function is the trusted server-side path).
  FOR v_recipient IN
    SELECT id FROM user_profiles
     WHERE role IN ('principal', 'admin')
       AND (school_id = v_school_id OR school_id IS NULL)
  LOOP
    INSERT INTO notifications (user_id, title, body, type, reference_id)
    VALUES (
      v_recipient,
      'New student registration',
      COALESCE(v_full_name, 'A parent') || ' requested to add '
        || btrim(p_first_name) || ' ' || btrim(p_last_name)
        || '. Review and approve in Students.',
      'student_registration',
      v_student_id
    );
  END LOOP;

  RETURN v_student_id;
END $$;

GRANT EXECUTE ON FUNCTION request_add_student(
  TEXT, TEXT, TEXT, DATE, TEXT, TEXT, BOOLEAN, TEXT, BOOLEAN
) TO authenticated;
