-- Migration 015: Storage buckets + policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('student-photos', 'student-photos', false, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('profile-photos', 'profile-photos', false, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- student-photos bucket
-- ============================================================

-- Any authenticated non-guest user can upload student photos.
-- Parents upload pictures for their linked children; admin/principal upload
-- on behalf of others. Reads are scoped the same way.
CREATE POLICY "Student photos: authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-photos'
    AND NOT is_guest()
  );

CREATE POLICY "Student photos: authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND NOT is_guest()
  );

CREATE POLICY "Student photos: authenticated read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND NOT is_guest()
  );

CREATE POLICY "Student photos: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND is_admin_or_principal()
  );

-- ============================================================
-- profile-photos bucket
-- ============================================================

-- Users can upload their own profile photo (folder = their uid)
CREATE POLICY "Profile photos: own upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Profile photos: own update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Profile photos: authenticated read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'profile-photos');
