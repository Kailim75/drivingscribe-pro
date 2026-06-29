
-- 1) Restrict webhook_api_key column access on organizations
REVOKE SELECT (webhook_api_key) ON public.organizations FROM authenticated, anon;

-- 2) Add UPDATE policy on documents storage bucket (owner/admin only)
CREATE POLICY "Owner/Admin can update documents in their org"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND has_any_role(auth.uid(), ((storage.foldername(name))[1])::uuid, ARRAY['owner'::app_role, 'admin'::app_role])
)
WITH CHECK (
  bucket_id = 'documents'
  AND has_any_role(auth.uid(), ((storage.foldername(name))[1])::uuid, ARRAY['owner'::app_role, 'admin'::app_role])
);
