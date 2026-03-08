
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
