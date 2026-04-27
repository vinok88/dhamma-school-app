-- Migration 014: get_announcement_view_stats RPC.
-- "viewed" is derived from the notifications table: a notification row exists
-- when delivered; deleting it (user tapped through) marks it viewed.

CREATE OR REPLACE FUNCTION get_announcement_view_stats(p_announcement_id UUID)
RETURNS TABLE (
  user_id   UUID,
  full_name TEXT,
  role      user_role,
  viewed    BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_announcement RECORD;
BEGIN
  SELECT * INTO v_announcement FROM announcements WHERE id = p_announcement_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_announcement.type IN ('school', 'emergency', 'event_reminder') THEN
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
      AND up.role <> 'guest'
      AND up.id != v_announcement.author_id;

  ELSIF v_announcement.type = 'class' AND v_announcement.target_class_id IS NOT NULL THEN
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
        up.id IN (
          SELECT sp.parent_user_id
            FROM student_parents sp
            JOIN students s ON s.id = sp.student_id
           WHERE s.class_id = v_announcement.target_class_id
             AND sp.parent_user_id IS NOT NULL
        )
        OR up.id IN (SELECT c.teacher_id FROM classes c WHERE c.id = v_announcement.target_class_id)
      );
  END IF;
END;
$$;
