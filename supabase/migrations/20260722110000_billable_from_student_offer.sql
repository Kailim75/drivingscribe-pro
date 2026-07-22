-- Facturation des séances au prix de l'offre choisie sur la fiche de l'élève.
--
-- Avant : toute séance liée à une formule était valorisée à 0 € (« couverte »),
-- quel que soit le type d'offre. C'est correct pour un pack/forfait (facturé une
-- fois à l'achat), mais FAUX pour une offre « à l'heure » : chaque séance validée
-- doit être facturée au tarif horaire de l'offre de l'élève. Les séances sans
-- offre restent au tarif horaire par défaut de l'organisation.

-- ── 1. Libérer les séances prisonnières des factures brouillon à 0 € ──────────
-- Les brouillons à 0 € créés par l'ancien bug retiennent des séances via
-- source_lesson_id, ce qui les exclut de toute nouvelle facturation.
-- Un brouillon à 0 € n'a aucune réalité comptable : on l'archive (réversible).
UPDATE public.invoices
SET status = 'archivé',
    notes = COALESCE(notes, '') || E'\nArchivée automatiquement : brouillon à 0 € issu de l''ancien calcul (séances libérées pour refacturation).'
WHERE status = 'brouillon'
  AND type = 'facture'
  AND total_ttc = 0;

-- ── 2. Moteur de prix : tenir compte du type d'offre ──────────────────────────
CREATE OR REPLACE FUNCTION public.compute_lesson_billable_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rate numeric;
  _factor numeric;
  _formula_price numeric;
  _formula_type text;
  _should_recompute boolean;
BEGIN
  -- Only auto-compute when the caller left billable_amount at 0
  -- (allows manual override by explicitly setting a non-zero value)
  _should_recompute := (TG_OP = 'INSERT' AND COALESCE(NEW.billable_amount, 0) = 0)
    OR (TG_OP = 'UPDATE' AND (
         NEW.billable_amount = 0
      OR NEW.duration_hours IS DISTINCT FROM OLD.duration_hours
      OR NEW.billing_rule IS DISTINCT FROM OLD.billing_rule
      OR NEW.formula_id IS DISTINCT FROM OLD.formula_id
    ));

  IF NOT _should_recompute THEN
    RETURN NEW;
  END IF;

  _factor := CASE NEW.billing_rule
    WHEN 'totale' THEN 1
    WHEN 'partielle' THEN 0.5
    WHEN 'non_facturee' THEN 0
    ELSE 1
  END;

  IF NEW.formula_id IS NOT NULL THEN
    SELECT total_price, offer_type::text
    INTO _formula_price, _formula_type
    FROM public.student_formulas
    WHERE id = NEW.formula_id;

    IF _formula_type = 'heure' THEN
      -- Offre « à l'heure » : le prix de l'offre EST le tarif horaire de l'élève.
      NEW.billable_amount := ROUND(COALESCE(NEW.duration_hours, 0) * COALESCE(_formula_price, 0) * _factor, 2);
    ELSE
      -- Pack / forfait : heures prépayées, facturées une fois à l'achat.
      NEW.billable_amount := 0;
    END IF;
    RETURN NEW;
  END IF;

  -- Sans offre : tarif horaire par défaut de l'organisation.
  SELECT COALESCE(default_hourly_rate, 50) INTO _rate
  FROM public.organizations WHERE id = NEW.organization_id;

  NEW.billable_amount := ROUND(COALESCE(NEW.duration_hours, 0) * COALESCE(_rate, 0) * _factor, 2);
  RETURN NEW;
END;
$$;

-- ── 3. Recalculer les séances existantes concernées ───────────────────────────
-- Uniquement : liées à une offre « à l'heure », encore à 0 €, facturables,
-- et absentes de toute facture active (on ne touche jamais une séance déjà
-- rattachée à une facture émise).
UPDATE public.lessons l
SET billable_amount = ROUND(
  COALESCE(l.duration_hours, 0) * COALESCE(sf.total_price, 0)
  * CASE l.billing_rule WHEN 'totale' THEN 1 WHEN 'partielle' THEN 0.5 ELSE 0 END,
  2)
FROM public.student_formulas sf
WHERE sf.id = l.formula_id
  AND sf.offer_type::text = 'heure'
  AND l.billable_amount = 0
  AND l.billing_rule <> 'non_facturee'
  AND NOT EXISTS (
    SELECT 1
    FROM public.invoice_lines il
    JOIN public.invoices i ON i.id = il.invoice_id
    WHERE il.source_lesson_id = l.id
      AND i.status <> 'archivé'
  );
