-- Fix 9: Active students must have a class assigned
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'active_requires_class' AND conrelid = 'students'::regclass
  ) THEN
    ALTER TABLE students
      ADD CONSTRAINT active_requires_class
      CHECK (status != 'active' OR class_id IS NOT NULL);
  END IF;
END;
$$;

-- Fix 10: Audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,                 -- auth.uid() at time of change (NULL for triggers from service role)
  action      TEXT NOT NULL,        -- 'INSERT', 'UPDATE', 'DELETE'
  table_name  TEXT NOT NULL,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(
      CASE WHEN TG_OP != 'DELETE' THEN (NEW.id) END,
      (OLD.id)
    ),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply to key tables (drop first to allow re-running idempotently)
DROP TRIGGER IF EXISTS audit_students ON students;
CREATE TRIGGER audit_students
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_user_profiles ON user_profiles;
CREATE TRIGGER audit_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_attendance ON attendance_records;
CREATE TRIGGER audit_attendance
  AFTER INSERT OR UPDATE OR DELETE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- RLS: only admins can read audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit: admin read" ON audit_logs;
CREATE POLICY "Audit: admin read"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );
