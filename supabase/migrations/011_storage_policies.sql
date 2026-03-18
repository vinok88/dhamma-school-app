-- Migration 011: Storage bucket creation and RLS policies

-- ============================================================
-- Create storage buckets (idempotent)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('student-photos', 'student-photos', false, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('profile-photos', 'profile-photos', false, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- student-photos bucket policies
-- ============================================================

-- Parents can upload photos for their own students
DROP POLICY IF EXISTS "Student photos: parent upload" ON storage.objects;
CREATE POLICY "Student photos: parent upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-photos'
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'parent'
  );

-- Parents can update (upsert) their own students' photos
DROP POLICY IF EXISTS "Student photos: parent update" ON storage.objects;
CREATE POLICY "Student photos: parent update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'parent'
  );

-- Authenticated users can read student photos
DROP POLICY IF EXISTS "Student photos: authenticated read" ON storage.objects;
CREATE POLICY "Student photos: authenticated read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'student-photos');

-- Admin can delete student photos
DROP POLICY IF EXISTS "Student photos: admin delete" ON storage.objects;
CREATE POLICY "Student photos: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- profile-photos bucket policies
-- ============================================================

-- Users can upload their own profile photo
DROP POLICY IF EXISTS "Profile photos: own upload" ON storage.objects;
CREATE POLICY "Profile photos: own upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own profile photo
DROP POLICY IF EXISTS "Profile photos: own update" ON storage.objects;
CREATE POLICY "Profile photos: own update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can read profile photos
DROP POLICY IF EXISTS "Profile photos: authenticated read" ON storage.objects;
CREATE POLICY "Profile photos: authenticated read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'profile-photos');
