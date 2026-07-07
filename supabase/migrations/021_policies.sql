-- Migration 021: editable policy documents (e.g. photo consent).
--
-- Stored in the DB so wording can change without an app release. The app fetches
-- and caches these for a week, falling back to a bundled copy when offline.

CREATE TABLE IF NOT EXISTS policies (
  key        TEXT PRIMARY KEY,      -- e.g. 'photo_consent'
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  url        TEXT,                  -- optional external link (e.g. Google Drive)
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_policies_updated_at ON policies;
CREATE TRIGGER set_policies_updated_at
  BEFORE UPDATE ON policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- Readable by any authenticated user (shown during registration).
DROP POLICY IF EXISTS "Policies: authenticated read" ON policies;
CREATE POLICY "Policies: authenticated read"
  ON policies FOR SELECT
  TO authenticated
  USING (true);

-- Only admins/principals can edit policy wording.
DROP POLICY IF EXISTS "Policies: admin write" ON policies;
CREATE POLICY "Policies: admin write"
  ON policies FOR ALL
  TO authenticated
  USING (is_admin_or_principal())
  WITH CHECK (is_admin_or_principal());

-- Seed the photo-consent policy (dollar-quoted to keep apostrophes intact).
INSERT INTO policies (key, title, body, url) VALUES (
  'photo_consent',
  'Photo Publish Consent',
  $body$By granting photo publish consent, you allow Mahamevnawa Dhamma School (Southbank) to photograph or video your child during school sessions, events, and activities, and to use those images for the purposes described below.

How images may be used:
• Internal records and class galleries shared with parents/guardians.
• School newsletters, notice boards, and event recaps.
• The school's official social media and website.

Your choices:
• Consent is entirely optional and does not affect your child's enrolment.
• You may withdraw or change your consent at any time by contacting the school or updating your child's profile in this app.
• Images will not be sold or shared with third parties for commercial purposes.

If you do not grant consent, your child's photo will still be stored for attendance and identification but will not be published in any of the above.$body$,
  NULL
)
ON CONFLICT (key) DO NOTHING;
