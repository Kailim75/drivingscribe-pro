
-- Table des tiers payeurs
CREATE TABLE public.payers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  siret text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.payers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view payers" ON public.payers
  FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Owner/Admin can create payers" ON public.payers
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

CREATE POLICY "Owner/Admin can update payers" ON public.payers
  FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

CREATE POLICY "Owner/Admin can delete payers" ON public.payers
  FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- Ajout payer_id sur students (nullable, l'élève peut être son propre payeur)
ALTER TABLE public.students ADD COLUMN payer_id uuid REFERENCES public.payers(id) ON DELETE SET NULL;

-- Ajout payer_id sur invoices (nullable, compatibilité avec factures individuelles)
ALTER TABLE public.invoices ADD COLUMN payer_id uuid REFERENCES public.payers(id) ON DELETE SET NULL;

-- Traçabilité anti-doublon sur invoice_lines
ALTER TABLE public.invoice_lines ADD COLUMN source_lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL;
ALTER TABLE public.invoice_lines ADD COLUMN source_formula_id uuid REFERENCES public.student_formulas(id) ON DELETE SET NULL;

-- Index uniques filtrés pour idempotence : une séance/formule ne peut être facturée qu'une seule fois
CREATE UNIQUE INDEX idx_invoice_lines_unique_lesson 
  ON public.invoice_lines(source_lesson_id) 
  WHERE source_lesson_id IS NOT NULL;

CREATE UNIQUE INDEX idx_invoice_lines_unique_formula 
  ON public.invoice_lines(source_formula_id) 
  WHERE source_formula_id IS NOT NULL;

-- Trigger updated_at pour payers
CREATE TRIGGER update_payers_updated_at
  BEFORE UPDATE ON public.payers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
