-- Migration 012: audit log

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  action      TEXT NOT NULL,
  table_name  TEXT NOT NULL,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(
      CASE WHEN TG_OP <> 'DELETE' THEN (NEW.id) END,
      (OLD.id)
    ),
    CASE WHEN TG_OP = 'DELETE'  THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_students
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_attendance
  AFTER INSERT OR UPDATE OR DELETE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
