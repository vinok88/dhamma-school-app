-- Migration 000: Reset
-- Drops all application tables, types, and functions so the rest of the
-- migrations can rebuild a clean schema. Also wipes auth.users (cascades).
--
-- Run this ONCE on a stale database. Skip on a fresh project.

-- ============================================================
-- Drop application tables (CASCADE handles FKs and policies)
-- ============================================================
DROP TABLE IF EXISTS audit_logs            CASCADE;
DROP TABLE IF EXISTS notifications         CASCADE;
DROP TABLE IF EXISTS messages              CASCADE;
DROP TABLE IF EXISTS events                CASCADE;
DROP TABLE IF EXISTS announcements         CASCADE;
DROP TABLE IF EXISTS attendance_records    CASCADE;
DROP TABLE IF EXISTS teacher_invitations   CASCADE;
DROP TABLE IF EXISTS student_parents       CASCADE;
DROP TABLE IF EXISTS students              CASCADE;
DROP TABLE IF EXISTS classes               CASCADE;
DROP TABLE IF EXISTS user_profiles         CASCADE;
DROP TABLE IF EXISTS schools               CASCADE;

-- ============================================================
-- Drop functions
-- ============================================================
DROP FUNCTION IF EXISTS resolve_user_role_for_signup(TEXT)         CASCADE;
DROP FUNCTION IF EXISTS refresh_my_role()                          CASCADE;
DROP FUNCTION IF EXISTS upgrade_guest_on_student_parent_insert()   CASCADE;
DROP FUNCTION IF EXISTS upgrade_guest_on_teacher_invitation_insert() CASCADE;
DROP FUNCTION IF EXISTS lowercase_student_parent_email()           CASCADE;
DROP FUNCTION IF EXISTS lowercase_teacher_invitation_email()       CASCADE;
DROP FUNCTION IF EXISTS get_announcement_view_stats(UUID)          CASCADE;
DROP FUNCTION IF EXISTS get_my_role()                              CASCADE;
DROP FUNCTION IF EXISTS is_admin_or_principal()                    CASCADE;
DROP FUNCTION IF EXISTS is_guest()                                 CASCADE;
DROP FUNCTION IF EXISTS log_audit_event()                          CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column()                 CASCADE;

-- ============================================================
-- Drop enums
-- ============================================================
DROP TYPE IF EXISTS user_role         CASCADE;
DROP TYPE IF EXISTS user_status       CASCADE;
DROP TYPE IF EXISTS student_status    CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS announcement_type CASCADE;
DROP TYPE IF EXISTS event_type        CASCADE;

-- ============================================================
-- Drop storage buckets and policies
-- ============================================================
-- Storage policies live on storage.objects; drop by name (idempotent)
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Student photos: parent upload" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Student photos: parent update" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Student photos: authenticated read" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Student photos: admin delete" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Profile photos: own upload" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Profile photos: own update" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Profile photos: authenticated read" ON storage.objects';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Empty buckets and remove them. Skip silently if buckets don't exist.
DO $$ BEGIN
  DELETE FROM storage.objects WHERE bucket_id IN ('student-photos', 'profile-photos');
  DELETE FROM storage.buckets WHERE id IN ('student-photos', 'profile-photos');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- Wipe auth users (cascades into anything still referencing it)
-- ============================================================
DELETE FROM auth.users;
