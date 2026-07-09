-- Migration 024: teacher documents (WWCC + resume).
--
-- Teachers upload a Working With Children Check and (optionally) a resume as PDFs.
-- These are sensitive PII, so they live in a PRIVATE bucket accessed via
-- short-lived signed URLs — only the teacher (own folder) and admins/principals
-- can read them. The principal reviews them before approving a pending teacher.

-- Storage-path columns on the teacher's profile row.
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS wwcc_url   TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- Private bucket (PDF only).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('teacher-documents', 'teacher-documents', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Teacher manages their own documents (folder = their uid).
DROP POLICY IF EXISTS "Teacher docs: own upload" ON storage.objects;
CREATE POLICY "Teacher docs: own upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'teacher-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Teacher docs: own update" ON storage.objects;
CREATE POLICY "Teacher docs: own update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'teacher-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Teacher docs: own read" ON storage.objects;
CREATE POLICY "Teacher docs: own read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'teacher-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins / principals can read every teacher's documents (for approval review).
DROP POLICY IF EXISTS "Teacher docs: admin read" ON storage.objects;
CREATE POLICY "Teacher docs: admin read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'teacher-documents'
    AND is_admin_or_principal()
  );
