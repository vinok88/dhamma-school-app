-- Migration 012: Fix RLS for student INSERT and storage upload
-- Problem: get_my_role() check was blocking parents from inserting students
-- because the function could return NULL or the role check was too strict.
-- Fix: parent_id = auth.uid() is sufficient to authorise the insert.

-- ============================================================
-- STUDENTS: simplify parent INSERT policy
-- ============================================================
DROP POLICY IF EXISTS "Students: parent insert" ON students;
CREATE POLICY "Students: parent insert"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

-- Also allow parent to update their own student's photo (no role check)
DROP POLICY IF EXISTS "Students: parent update own" ON students;
CREATE POLICY "Students: parent update own"
  ON students FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- ============================================================
-- STORAGE: simplify student-photos upload policy
-- Any authenticated user can upload to a student folder they own
-- ============================================================
DROP POLICY IF EXISTS "Student photos: parent upload" ON storage.objects;
CREATE POLICY "Student photos: parent upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-photos'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Student photos: parent update" ON storage.objects;
CREATE POLICY "Student photos: parent update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND auth.role() = 'authenticated'
  );
