-- Migration 013: Role-resolution RPCs and auto-upgrade triggers.
--
-- The signup flow:
--   1. Client calls resolve_user_role_for_signup(email) right after signing in.
--      This RPC is read-only — it just returns 'teacher' / 'parent' / 'guest'.
--   2. Client inserts the user_profiles row using that role.
--   3. An AFTER-INSERT trigger on user_profiles claims any matching
--      student_parents / teacher_invitations rows by email. Doing the linking
--      in a trigger (instead of inside the RPC) avoids a chicken-and-egg FK
--      violation: parent_user_id / claimed_by reference user_profiles(id),
--      which doesn't exist until step 2 commits.
--
-- After signup, refresh_my_role() can be invoked from the home-screen "refresh"
-- button to re-check (e.g. principal added the email later).

CREATE OR REPLACE FUNCTION resolve_user_role_for_signup(p_email TEXT)
RETURNS user_role
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  email_lc TEXT := lower(p_email);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'resolve_user_role_for_signup requires authenticated user';
  END IF;

  IF EXISTS (SELECT 1 FROM teacher_invitations WHERE lower(email) = email_lc) THEN
    RETURN 'teacher';
  ELSIF EXISTS (SELECT 1 FROM student_parents WHERE lower(parent_email) = email_lc) THEN
    RETURN 'parent';
  ELSE
    RETURN 'guest';
  END IF;
END $$;

-- Link any matching student_parents / teacher_invitations rows when the
-- corresponding user_profiles row is created.
CREATE OR REPLACE FUNCTION link_invitations_on_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
  IF v_email IS NULL THEN RETURN NEW; END IF;
  v_email := lower(v_email);

  UPDATE student_parents
     SET parent_user_id = NEW.id
   WHERE lower(parent_email) = v_email
     AND parent_user_id IS NULL;

  UPDATE teacher_invitations
     SET claimed_by = NEW.id
   WHERE lower(email) = v_email
     AND claimed_by IS NULL;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS up_link_on_insert ON user_profiles;
CREATE TRIGGER up_link_on_insert
  AFTER INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION link_invitations_on_profile_insert();

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
    -- Fall back: link any existing user with that email (teachers, admins,
    -- principals). We never *demote* their primary role here — the link
    -- table simply records that they are also a parent, and they can use
    -- Switch Profile to view as one at runtime.
    SELECT up.id INTO v_uid
      FROM user_profiles up
      JOIN auth.users au ON au.id = up.id
     WHERE lower(au.email) = lower(NEW.parent_email);
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
  v_uid  UUID;
  v_role user_role;
BEGIN
  -- Find any existing user with this email; capture their current role too.
  SELECT up.id, up.role INTO v_uid, v_role
    FROM user_profiles up
    JOIN auth.users au ON au.id = up.id
   WHERE lower(au.email) = lower(NEW.email);

  IF v_uid IS NOT NULL THEN
    -- Always claim the invitation so admin tooling reflects the link.
    NEW.claimed_by := v_uid;
    -- Only upgrade to teacher if the user isn't already an admin/principal —
    -- we never demote a higher-privilege role.
    IF v_role NOT IN ('admin', 'principal') THEN
      UPDATE user_profiles SET role = 'teacher', updated_at = NOW() WHERE id = v_uid;
    END IF;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER ti_upgrade_guest
  BEFORE INSERT ON teacher_invitations
  FOR EACH ROW EXECUTE FUNCTION upgrade_guest_on_teacher_invitation_insert();
