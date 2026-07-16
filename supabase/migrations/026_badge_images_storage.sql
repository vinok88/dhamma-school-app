-- Migration 026: public storage bucket for badge images.
--
-- Badge art is non-sensitive, so the bucket is public (stable URLs, no signing).
-- Staff (teacher/admin/principal) upload; everyone can read.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('badge-images', 'badge-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Badge images: public read" ON storage.objects;
CREATE POLICY "Badge images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'badge-images');

DROP POLICY IF EXISTS "Badge images: staff write" ON storage.objects;
CREATE POLICY "Badge images: staff write"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'badge-images' AND get_my_role() IN ('teacher', 'admin', 'principal'))
  WITH CHECK (bucket_id = 'badge-images' AND get_my_role() IN ('teacher', 'admin', 'principal'));
