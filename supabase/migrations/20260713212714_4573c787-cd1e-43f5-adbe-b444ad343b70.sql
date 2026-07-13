DROP INDEX IF EXISTS public.idx_invoice_lines_unique_lesson;
DROP INDEX IF EXISTS public.idx_invoice_lines_unique_formula;

CREATE OR REPLACE FUNCTION public.prevent_duplicate_active_invoice_source()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_invoice_status public.invoice_status;
  _new_organization_id uuid;
BEGIN
  SELECT status, organization_id
  INTO _new_invoice_status, _new_organization_id
  FROM public.invoices
  WHERE id = NEW.invoice_id;

  IF _new_invoice_status IS NULL OR _new_invoice_status = 'archivé' THEN
    RETURN NEW;
  END IF;

  IF NEW.source_lesson_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.invoice_lines il
    JOIN public.invoices i ON i.id = il.invoice_id
    WHERE il.source_lesson_id = NEW.source_lesson_id
      AND i.organization_id = _new_organization_id
      AND i.status <> 'archivé'
      AND il.id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'Cette séance est déjà rattachée à une facture active.';
  END IF;

  IF NEW.source_formula_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.invoice_lines il
    JOIN public.invoices i ON i.id = il.invoice_id
    WHERE il.source_formula_id = NEW.source_formula_id
      AND i.organization_id = _new_organization_id
      AND i.status <> 'archivé'
      AND il.id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'Cette formule est déjà rattachée à une facture active.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_duplicate_active_invoice_source_trigger ON public.invoice_lines;
CREATE TRIGGER prevent_duplicate_active_invoice_source_trigger
  BEFORE INSERT OR UPDATE OF invoice_id, source_lesson_id, source_formula_id
  ON public.invoice_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_active_invoice_source();

CREATE INDEX IF NOT EXISTS idx_invoice_lines_source_lesson_id
  ON public.invoice_lines(source_lesson_id)
  WHERE source_lesson_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_lines_source_formula_id
  ON public.invoice_lines(source_formula_id)
  WHERE source_formula_id IS NOT NULL;