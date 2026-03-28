
-- Add branding columns to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#1e40af',
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#f59e0b',
  ADD COLUMN IF NOT EXISTS document_logo_url text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS footer_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS document_header text DEFAULT '',
  ADD COLUMN IF NOT EXISTS legal_mentions text DEFAULT '',
  ADD COLUMN IF NOT EXISTS signature_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS signature_text text DEFAULT '';

-- Create public logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for logos bucket
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'logos');

CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'logos');
