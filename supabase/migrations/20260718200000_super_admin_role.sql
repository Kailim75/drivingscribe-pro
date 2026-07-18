-- Lot 1 — Sécurité des rôles : rôle super-admin plateforme distinct du rôle « owner » d'organisation.
-- Avant cette migration, toute personne ayant créé son organisation (rôle owner) pouvait appeler
-- les fonctions admin_* : voir toutes les organisations, les suspendre ou les supprimer.

-- 1. Table des administrateurs plateforme.
-- RLS activée SANS policy : aucune lecture/écriture possible depuis le client,
-- seule la clé service ou une fonction SECURITY DEFINER peut la consulter.
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_admins FROM PUBLIC, anon, authenticated;

-- 2. Fonction de contrôle unique.
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = _user_id);
$$;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

-- 3. Amorçage : le compte plateforme connu. Ne fait rien si cet email n'a pas de compte ;
-- dans ce cas, ajouter l'administrateur à la main :
--   INSERT INTO public.platform_admins (user_id) SELECT id FROM auth.users WHERE lower(email) = '<email>';
INSERT INTO public.platform_admins (user_id)
SELECT id FROM auth.users WHERE lower(email) = 'dropacademymontrouge@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 4. Remplacement du verrou dans les 6 fonctions admin_*.
-- Réécriture programmatique : on repart du corps EXACT stocké en base (pg_get_functiondef),
-- on remplace uniquement la garde « a le rôle owner quelque part » par is_super_admin(),
-- et on échoue bruyamment si une fonction ne contient pas la garde attendue (dérive → revue manuelle).
DO $$
DECLARE
  fn record;
  src text;
  guard_pattern text := 'IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ''owner'') THEN';
  replaced int := 0;
BEGIN
  FOR fn IN
    SELECT p.oid, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'admin_get_global_stats',
        'admin_suspend_organization',
        'admin_delete_organization',
        'admin_suspend_user',
        'admin_delete_user',
        'admin_generate_api_key'
      )
  LOOP
    src := pg_get_functiondef(fn.oid);
    IF position(guard_pattern IN src) = 0 THEN
      RAISE EXCEPTION 'Fonction % : garde owner introuvable, migration interrompue — vérifier la définition en base', fn.proname;
    END IF;
    EXECUTE replace(src, guard_pattern, 'IF NOT public.is_super_admin() THEN');
    replaced := replaced + 1;
  END LOOP;
  IF replaced <> 6 THEN
    RAISE EXCEPTION 'Attendu 6 fonctions admin_*, % trouvée(s) — vérifier le schéma', replaced;
  END IF;
END $$;

-- 5. next_document_number : contrôle d'appartenance à l'organisation.
-- Sans ce contrôle, tout utilisateur authentifié pouvait incrémenter le compteur de factures
-- d'une autre organisation (trous de numérotation = problème légal).
-- auth.uid() IS NULL = appel via clé service (edge function) : autorisé, l'anon n'ayant pas EXECUTE.
CREATE OR REPLACE FUNCTION public.next_document_number(
  _org_id uuid,
  _type text -- 'facture' or 'devis'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _prefix text;
  _next int;
  _result text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = _org_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF _type = 'devis' THEN
    UPDATE organizations
    SET quote_next_number = quote_next_number + 1, updated_at = now()
    WHERE id = _org_id
    RETURNING quote_prefix, quote_next_number - 1 INTO _prefix, _next;
  ELSE
    UPDATE organizations
    SET invoice_next_number = invoice_next_number + 1, updated_at = now()
    WHERE id = _org_id
    RETURNING invoice_prefix, invoice_next_number - 1 INTO _prefix, _next;
  END IF;

  _result := COALESCE(_prefix, CASE WHEN _type = 'devis' THEN 'D' ELSE 'F' END)
    || '-' || EXTRACT(YEAR FROM now())::text
    || '-' || lpad(_next::text, 3, '0');

  RETURN _result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.next_document_number(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_document_number(uuid, text) TO authenticated;
