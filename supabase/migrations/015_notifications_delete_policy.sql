-- Allow users to delete their own notifications
DROP POLICY IF EXISTS "Notifications: own delete" ON notifications;
CREATE POLICY "Notifications: own delete"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
