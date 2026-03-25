-- Migration 013: Allow admin to update any user_profile row
-- Required for teacher approval/rejection from the admin registrations screen

DROP POLICY IF EXISTS "Profiles: admin update all" ON user_profiles;
CREATE POLICY "Profiles: admin update all"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');
