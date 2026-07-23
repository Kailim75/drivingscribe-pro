-- Le prix d'une séance vient de la fiche de l'élève, AUTOMATIQUEMENT.
--
-- Jusqu'ici, une séance n'était valorisée au tarif de l'offre de l'élève que si
-- le moniteur liait explicitement l'offre en créant la séance dans le planning.
-- Sinon : tarif générique de l'organisation (50 € par défaut). En pratique les
-- séances sont créées sans lien → tout sortait à 50 €.
--
-- Désormais : si la séance n'est liée à aucune formule, le moteur va chercher
-- l'offre « à l'heure » ACTIVE la plus récente de la fiche de l'élève, lie la
-- séance à cette formule et la valorise durée × tarif de l'offre.
-- Les packs/forfaits ne sont jamais auto-liés (leur logique de consommation
-- d'heures doit rester un choix explicite) ; sans offre active, le tarif par
-- défaut de l'organisation s'applique comme avant.

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
  _auto_formula_id uuid;
  _should_recompute boolean;
BEGIN
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

  -- Séance sans offre liée : reprendre l'offre « à l'heure » active de la fiche élève
  IF NEW.formula_id IS NULL THEN
    SELECT id, total_price
    INTO _auto_formula_id, _formula_price
    FROM public.student_formulas
    WHERE student_id = NEW.student_id
      AND organization_id = NEW.organization_id
      AND active = true
      AND offer_type::text = 'heure'
    ORDER BY created_at DESC
    LIMIT 1;

    IF _auto_formula_id IS NOT NULL THEN
      NEW.formula_id := _auto_formula_id;
      NEW.billable_amount := ROUND(COALESCE(NEW.duration_hours, 0) * COALESCE(_formula_price, 0) * _factor, 2);
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.formula_id IS NOT NULL THEN
    SELECT total_price, offer_type::text
    INTO _formula_price, _formula_type
    FROM public.student_formulas
    WHERE id = NEW.formula_id;

    IF _formula_type = 'heure' THEN
      NEW.billable_amount := ROUND(COALESCE(NEW.duration_hours, 0) * COALESCE(_formula_price, 0) * _factor, 2);
    ELSE
      -- Pack / forfait : heures prépayées, facturées une fois à l'achat.
      NEW.billable_amount := 0;
    END IF;
    RETURN NEW;
  END IF;

  SELECT COALESCE(default_hourly_rate, 50) INTO _rate
  FROM public.organizations WHERE id = NEW.organization_id;

  NEW.billable_amount := ROUND(COALESCE(NEW.duration_hours, 0) * COALESCE(_rate, 0) * _factor, 2);
  RETURN NEW;
END;
$$;

-- Rattrapage des séances existantes : non facturées, sans formule liée, dont
-- l'élève a une offre « à l'heure » active → liaison + re-valorisation.
-- On ne touche JAMAIS une séance déjà rattachée à une facture active.
WITH active_hour_formula AS (
  SELECT DISTINCT ON (student_id) id, student_id, total_price
  FROM public.student_formulas
  WHERE active = true AND offer_type::text = 'heure'
  ORDER BY student_id, created_at DESC
)
UPDATE public.lessons l
SET formula_id = f.id,
    billable_amount = ROUND(
      COALESCE(l.duration_hours, 0) * COALESCE(f.total_price, 0)
      * CASE l.billing_rule WHEN 'totale' THEN 1 WHEN 'partielle' THEN 0.5 ELSE 0 END,
      2)
FROM active_hour_formula f
WHERE f.student_id = l.student_id
  AND l.formula_id IS NULL
  AND l.billing_rule <> 'non_facturee'
  AND NOT EXISTS (
    SELECT 1
    FROM public.invoice_lines il
    JOIN public.invoices i ON i.id = il.invoice_id
    WHERE il.source_lesson_id = l.id
      AND i.status <> 'archivé'
  );
