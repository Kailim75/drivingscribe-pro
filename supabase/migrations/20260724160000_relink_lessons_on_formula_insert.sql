-- Quand une offre « à l'heure » est ajoutée sur la fiche d'un élève, les séances
-- existantes de cet élève non facturées et sans formule sont automatiquement
-- liées et re-tarifées. Sans cela, l'ajout d'une offre ne corrigeait que les
-- séances FUTURES : l'utilisateur ajoutait l'offre, relançait la facturation
-- groupée et retrouvait encore le tarif par défaut sur les séances déjà au
-- planning.

CREATE OR REPLACE FUNCTION public.link_lessons_to_new_hour_formula()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.active = true AND NEW.offer_type::text = 'heure' THEN
    -- On ne pose que formula_id : le trigger BEFORE UPDATE de lessons
    -- (compute_lesson_billable_amount) recalcule le prix — source unique de vérité.
    UPDATE public.lessons l
    SET formula_id = NEW.id
    WHERE l.student_id = NEW.student_id
      AND l.organization_id = NEW.organization_id
      AND l.formula_id IS NULL
      AND l.billing_rule <> 'non_facturee'
      AND NOT EXISTS (
        SELECT 1
        FROM public.invoice_lines il
        JOIN public.invoices i ON i.id = il.invoice_id
        WHERE il.source_lesson_id = l.id
          AND i.status <> 'archivé'
      );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_lessons_on_formula_insert ON public.student_formulas;
CREATE TRIGGER trg_link_lessons_on_formula_insert
AFTER INSERT ON public.student_formulas
FOR EACH ROW EXECUTE FUNCTION public.link_lessons_to_new_hour_formula();
