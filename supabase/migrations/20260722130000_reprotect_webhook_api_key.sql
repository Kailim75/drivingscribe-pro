-- Re-protection de organizations.webhook_api_key (issue « Critical » du scan sécurité).
--
-- Historique du trou :
--   18/06 : REVOKE SELECT table + GRANT SELECT colonne par colonne SANS webhook_api_key → protégé.
--   19/06 : une migration « réparation de permissions » a re-fait
--           GRANT SELECT ON public.organizations TO authenticated (table ENTIÈRE)
--           → la restriction par colonnes a été écrasée, clé re-exposée à tous les membres.
--   29/06 : REVOKE SELECT (webhook_api_key) — SANS EFFET : en PostgreSQL, un revoke
--           de colonne ne retranche rien à un grant posé au niveau de la table.
--
-- Correctif : retirer le grant table, re-granter TOUTES les colonnes actuelles sauf la clé.
-- Fait programmatiquement (information_schema) pour couvrir les colonnes ajoutées depuis
-- juin (default_hourly_rate…) et rester correct si le schéma évolue encore.
-- ⚠️ Ne jamais re-granter SELECT table entière sur organizations ; pour ajouter une
-- colonne lisible : GRANT SELECT (nouvelle_colonne) ON public.organizations TO authenticated;

DO $$
DECLARE
  cols text;
BEGIN
  REVOKE SELECT ON public.organizations FROM authenticated, anon;

  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'organizations'
    AND column_name <> 'webhook_api_key';

  IF cols IS NULL THEN
    RAISE EXCEPTION 'organizations : aucune colonne trouvée, abandon';
  END IF;

  EXECUTE format('GRANT SELECT (%s) ON public.organizations TO authenticated', cols);
END $$;

-- Le front n'est pas impacté : la page Paramètres lit la clé via le RPC
-- get_organization_webhook_key (réservé owner/admin) et le Super Admin via
-- admin_get_global_stats (réservé super-admin plateforme).
