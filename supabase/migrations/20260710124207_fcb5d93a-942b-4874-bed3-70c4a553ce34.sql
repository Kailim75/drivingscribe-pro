
-- 1) Default hourly rate on organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS default_hourly_rate numeric NOT NULL DEFAULT 50;

-- 2) Trigger function that auto-fills lessons.billable_amount
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
  _formula_hours numeric;
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

  -- Rule factor
  _factor := CASE NEW.billing_rule
    WHEN 'totale' THEN 1
    WHEN 'partielle' THEN 0.5
    WHEN 'non_facturee' THEN 0
    ELSE 1
  END;

  -- If linked to a paid formula (pack), the lesson is already covered
  IF NEW.formula_id IS NOT NULL THEN
    -- Charge nothing on the lesson; the formula was invoiced separately.
    NEW.billable_amount := 0;
    RETURN NEW;
  END IF;

  -- Free lesson: rate = organization default hourly rate
  SELECT COALESCE(default_hourly_rate, 50) INTO _rate
  FROM public.organizations WHERE id = NEW.organization_id;

  NEW.billable_amount := ROUND(COALESCE(NEW.duration_hours, 0) * COALESCE(_rate, 0) * _factor, 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_lesson_billable ON public.lessons;
CREATE TRIGGER trg_compute_lesson_billable
BEFORE INSERT OR UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.compute_lesson_billable_amount();

-- 3) Backfill existing lessons that were saved with billable_amount = 0
UPDATE public.lessons l
SET billable_amount = ROUND(
  COALESCE(l.duration_hours, 0)
  * COALESCE((SELECT default_hourly_rate FROM public.organizations WHERE id = l.organization_id), 50)
  * CASE l.billing_rule
      WHEN 'totale' THEN 1
      WHEN 'partielle' THEN 0.5
      WHEN 'non_facturee' THEN 0
      ELSE 1
    END,
  2)
WHERE l.billable_amount = 0
  AND l.formula_id IS NULL
  AND l.billing_rule <> 'non_facturee';
