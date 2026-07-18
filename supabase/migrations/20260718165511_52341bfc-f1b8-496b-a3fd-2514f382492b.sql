-- Lot 3 — Fiabilité des paiements + jeton public des factures.

CREATE OR REPLACE FUNCTION public.recalc_invoice_totals(_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_paid numeric;
  _total_ttc numeric;
  _current_status invoice_status;
  _new_status invoice_status;
BEGIN
  IF _invoice_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(sum(amount), 0) INTO _total_paid
  FROM payments WHERE invoice_id = _invoice_id;

  SELECT total_ttc, status INTO _total_ttc, _current_status
  FROM invoices WHERE id = _invoice_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF _total_ttc - _total_paid <= 0 AND _total_paid > 0 THEN
    _new_status := 'payé';
  ELSIF _total_paid > 0 THEN
    _new_status := 'partiellement_payé';
  ELSIF _current_status IN ('payé', 'partiellement_payé') THEN
    _new_status := 'envoyé';
  ELSE
    _new_status := _current_status;
  END IF;

  UPDATE invoices
  SET paid_amount = _total_paid,
      remaining_amount = GREATEST(0, _total_ttc - _total_paid),
      status = _new_status,
      updated_at = now()
  WHERE id = _invoice_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_payment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalc_invoice_totals(NEW.invoice_id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.recalc_invoice_totals(OLD.invoice_id);
    IF NEW.invoice_id IS DISTINCT FROM OLD.invoice_id THEN
      PERFORM public.recalc_invoice_totals(NEW.invoice_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_invoice_totals(OLD.invoice_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_recalc_invoice ON public.payments;
CREATE TRIGGER trg_payments_recalc_invoice
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.on_payment_change();

DO $mig$
DECLARE
  inv record;
BEGIN
  FOR inv IN
    SELECT i.id
    FROM invoices i
    LEFT JOIN LATERAL (
      SELECT COALESCE(sum(p.amount), 0) AS paid FROM payments p WHERE p.invoice_id = i.id
    ) pay ON true
    WHERE i.paid_amount IS DISTINCT FROM pay.paid
  LOOP
    PERFORM public.recalc_invoice_totals(inv.id);
  END LOOP;
END $mig$;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS public_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS invoices_public_token_idx ON public.invoices (public_token);