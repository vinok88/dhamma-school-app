-- Announcement view stats RPC function
-- Derives "viewed" status from the notifications table:
--   notification row exists for user + announcement → NOT viewed
--   notification row deleted (user tapped it) → viewed

CREATE OR REPLACE FUNCTION get_announcement_view_stats(p_announcement_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  role user_role,
  viewed BOOLEAN
) AS $$
DECLARE
  v_announcement RECORD;
BEGIN
  SELECT * INTO v_announcement FROM announcements WHERE id = p_announcement_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_announcement.type IN ('school', 'emergency', 'event_reminder') THEN
    -- All active users in the school (excluding the author)
    RETURN QUERY
    SELECT up.id, up.full_name, up.role,
           NOT EXISTS (
             SELECT 1 FROM notifications n
             WHERE n.user_id = up.id
               AND n.type = 'announcement'
               AND n.reference_id = p_announcement_id
           ) AS viewed
    FROM user_profiles up
    WHERE up.school_id = v_announcement.school_id
      AND up.status = 'active'
      AND up.id != v_announcement.author_id;

  ELSIF v_announcement.type = 'class' AND v_announcement.target_class_id IS NOT NULL THEN
    -- Parents of students in class + class teacher (excluding author)
    RETURN QUERY
    SELECT up.id, up.full_name, up.role,
           NOT EXISTS (
             SELECT 1 FROM notifications n
             WHERE n.user_id = up.id
               AND n.type = 'announcement'
               AND n.reference_id = p_announcement_id
           ) AS viewed
    FROM user_profiles up
    WHERE up.school_id = v_announcement.school_id
      AND up.status = 'active'
      AND up.id != v_announcement.author_id
      AND (
        up.id IN (SELECT s.parent_id FROM students s WHERE s.class_id = v_announcement.target_class_id)
        OR up.id IN (SELECT c.teacher_id FROM classes c WHERE c.id = v_announcement.target_class_id)
      );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
