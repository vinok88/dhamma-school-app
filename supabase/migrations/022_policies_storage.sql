-- Migration 022: public storage bucket for policy documents.
--
-- Holds the formatted policy files (e.g. a photo-consent PDF or HTML). The bucket
-- is public so the app can open a stable URL directly; admins/principals manage
-- the files. Point policies.url at the file's public URL, e.g.
--   {SUPABASE_URL}/storage/v1/object/public/policies/photo-consent.pdf

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'policies', 'policies', true, 10485760,
  ARRAY['application/pdf', 'text/html', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read policy documents (they are public information).
DROP POLICY IF EXISTS "Policy docs: public read" ON storage.objects;
CREATE POLICY "Policy docs: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'policies');

-- Only admins/principals can upload, replace, or remove policy documents.
DROP POLICY IF EXISTS "Policy docs: admin write" ON storage.objects;
CREATE POLICY "Policy docs: admin write"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'policies' AND is_admin_or_principal())
  WITH CHECK (bucket_id = 'policies' AND is_admin_or_principal());
