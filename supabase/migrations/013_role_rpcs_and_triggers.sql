-- Migration 013: Role-resolution RPCs and auto-upgrade triggers.
--
-- The signup flow:
--   1. Client calls resolve_user_role_for_signup(email) right after signing in.
--   2. The RPC checks teacher_invitations → student_parents → guest, links the
--      user to matching rows, and returns the role.
--   3. Client inserts the user_profiles row using that role.
--
-- After signup, refresh_my_role() can be invoked from the home-screen "refresh"
-- button to re-check (e.g. principal added the email later).

CREATE OR REPLACE FUNCTION resolve_user_role_for_signup(p_email TEXT)
RETURNS user_role
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  email_lc TEXT := lower(p_email);
  v_uid UUID := auth.uid();
  v_role user_role;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'resolve_user_role_for_signup requires authenticated user';
  END IF;

  IF EXISTS (SELECT 1 FROM teacher_invitations WHERE lower(email) = email_lc) THEN
    UPDATE teacher_invitations
       SET claimed_by = v_uid
     WHERE lower(email) = email_lc;
    v_role := 'teacher';
  ELSIF EXISTS (SELECT 1 FROM student_parents WHERE lower(parent_email) = email_lc) THEN
    UPDATE student_parents
       SET parent_user_id = v_uid
     WHERE lower(parent_email) = email_lc;
    v_role := 'parent';
  ELSE
    v_role := 'guest';
  END IF;

  RETURN v_role;
END $$;

CREATE OR REPLACE FUNCTION refresh_my_role()
RETURNS user_role
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid          UUID := auth.uid();
  v_email        TEXT;
  v_current_role user_role;
  v_new_role     user_role;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'refresh_my_role requires authenticated user';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  SELECT role  INTO v_current_role FROM user_profiles WHERE id = v_uid;

  IF v_email IS NULL THEN
    RETURN v_current_role;
  END IF;

  -- Never downgrade admin/principal
  IF v_current_role IN ('admin', 'principal') THEN
    RETURN v_current_role;
  END IF;

  v_email := lower(v_email);

  IF EXISTS (SELECT 1 FROM teacher_invitations WHERE lower(email) = v_email) THEN
    UPDATE teacher_invitations SET claimed_by = v_uid WHERE lower(email) = v_email;
    v_new_role := 'teacher';
  ELSIF EXISTS (SELECT 1 FROM student_parents WHERE lower(parent_email) = v_email) THEN
    UPDATE student_parents SET parent_user_id = v_uid WHERE lower(parent_email) = v_email;
    v_new_role := 'parent';
  ELSE
    v_new_role := COALESCE(v_current_role, 'guest');
  END IF;

  IF v_new_role <> v_current_role THEN
    UPDATE user_profiles SET role = v_new_role, updated_at = NOW() WHERE id = v_uid;
  END IF;

  RETURN v_new_role;
END $$;

-- ============================================================
-- Trigger: when a principal adds a parent email that matches an existing
-- guest, upgrade them to parent immediately and link the row.
-- ============================================================
CREATE OR REPLACE FUNCTION upgrade_guest_on_student_parent_insert()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid UUID;
BEGIN
  -- Try to find a matching guest user first
  SELECT up.id INTO v_uid
    FROM user_profiles up
    JOIN auth.users au ON au.id = up.id
   WHERE lower(au.email) = lower(NEW.parent_email)
     AND up.role = 'guest';

  IF v_uid IS NOT NULL THEN
    UPDATE user_profiles SET role = 'parent', updated_at = NOW() WHERE id = v_uid;
    NEW.parent_user_id := v_uid;
  ELSE
    -- Fall back: still link if a non-admin user exists with that email
    SELECT up.id INTO v_uid
      FROM user_profiles up
      JOIN auth.users au ON au.id = up.id
     WHERE lower(au.email) = lower(NEW.parent_email)
       AND up.role NOT IN ('admin', 'principal');
    IF v_uid IS NOT NULL THEN
      NEW.parent_user_id := v_uid;
    END IF;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER sp_upgrade_guest
  BEFORE INSERT ON student_parents
  FOR EACH ROW EXECUTE FUNCTION upgrade_guest_on_student_parent_insert();

-- ============================================================
-- Trigger: when a principal adds a teacher invitation that matches an
-- existing user, promote them to teacher immediately.
-- ============================================================
CREATE OR REPLACE FUNCTION upgrade_guest_on_teacher_invitation_insert()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT up.id INTO v_uid
    FROM user_profiles up
    JOIN auth.users au ON au.id = up.id
   WHERE lower(au.email) = lower(NEW.email)
     AND up.role NOT IN ('admin', 'principal');

  IF v_uid IS NOT NULL THEN
    UPDATE user_profiles SET role = 'teacher', updated_at = NOW() WHERE id = v_uid;
    NEW.claimed_by := v_uid;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER ti_upgrade_guest
  BEFORE INSERT ON teacher_invitations
  FOR EACH ROW EXECUTE FUNCTION upgrade_guest_on_teacher_invitation_insert();
