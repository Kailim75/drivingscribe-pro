
-- 1. Documents storage policies: scope to user's organization via path prefix
DROP POLICY IF EXISTS "Members can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Owner/Admin can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Owner/Admin can delete documents" ON storage.objects;

CREATE POLICY "Members can view documents in their org"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Owner/Admin can upload documents in their org"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND public.has_any_role(auth.uid(), ((storage.foldername(name))[1])::uuid, ARRAY['owner'::app_role,'admin'::app_role])
);

CREATE POLICY "Owner/Admin can delete documents in their org"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents'
  AND public.has_any_role(auth.uid(), ((storage.foldername(name))[1])::uuid, ARRAY['owner'::app_role,'admin'::app_role])
);

-- 2. Logos bucket: restrict listing/mutations to org members; public URLs still work via storage public endpoint
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

CREATE POLICY "Org members can list their logos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'logos'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Owner/Admin can upload org logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND public.has_any_role(auth.uid(), ((storage.foldername(name))[1])::uuid, ARRAY['owner'::app_role,'admin'::app_role])
);

CREATE POLICY "Owner/Admin can update org logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'logos'
  AND public.has_any_role(auth.uid(), ((storage.foldername(name))[1])::uuid, ARRAY['owner'::app_role,'admin'::app_role])
)
WITH CHECK (
  bucket_id = 'logos'
  AND public.has_any_role(auth.uid(), ((storage.foldername(name))[1])::uuid, ARRAY['owner'::app_role,'admin'::app_role])
);

CREATE POLICY "Owner/Admin can delete org logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'logos'
  AND public.has_any_role(auth.uid(), ((storage.foldername(name))[1])::uuid, ARRAY['owner'::app_role,'admin'::app_role])
);

-- 3. user_roles INSERT: require acting user to be a member of the target organization
DROP POLICY IF EXISTS "Owner/Admin can assign roles (restricted)" ON public.user_roles;
CREATE POLICY "Owner/Admin can assign roles (restricted)"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  public.is_org_member(auth.uid(), organization_id)
  AND (
    public.has_role(auth.uid(), organization_id, 'owner'::app_role)
    OR (role <> 'owner'::app_role AND public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role,'admin'::app_role]))
  )
);

-- 4. organizations create policy: require authenticated user (not literally true)
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. webhook_api_key: hide from regular org members via column-level grants
REVOKE SELECT ON public.organizations FROM authenticated, anon;
GRANT SELECT (
  id, name, email, phone, address, siret, tva_number, tva_rate, currency, timezone, locale,
  mode, invoice_prefix, quote_prefix, invoice_next_number, quote_next_number, cancellation_policy,
  logo_url, created_at, updated_at, webhook_url, suspended, webhook_calls_count, primary_color,
  accent_color, document_logo_url, website, footer_text, document_header, legal_mentions,
  signature_enabled, signature_text, document_template, tva_regime, cgv_text
) ON public.organizations TO authenticated;

CREATE OR REPLACE FUNCTION public.get_organization_webhook_key(_org_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _key text;
BEGIN
  IF NOT public.has_any_role(auth.uid(), _org_id, ARRAY['owner'::app_role,'admin'::app_role]) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  SELECT webhook_api_key INTO _key FROM public.organizations WHERE id = _org_id;
  RETURN _key;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_organization_webhook_key(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_organization_webhook_key(uuid) TO authenticated;

-- 6. Remove invoices/payments from realtime publication (not subscribed in client; avoids unauthorized channels)
ALTER PUBLICATION supabase_realtime DROP TABLE public.invoices;
ALTER PUBLICATION supabase_realtime DROP TABLE public.payments;

-- 7. Restrict admin SECURITY DEFINER functions from anon (they already check role inside)
REVOKE EXECUTE ON FUNCTION public.admin_suspend_organization(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_generate_api_key(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_suspend_user(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_organization(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_global_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
