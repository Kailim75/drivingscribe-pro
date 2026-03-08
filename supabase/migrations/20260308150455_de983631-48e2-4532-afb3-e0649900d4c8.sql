
-- Enums
CREATE TYPE public.invoice_type AS ENUM ('devis', 'facture');
CREATE TYPE public.invoice_status AS ENUM ('brouillon', 'envoyé', 'partiellement_payé', 'payé', 'en_retard', 'annulé', 'archivé');
CREATE TYPE public.payment_method AS ENUM ('espèces', 'virement', 'carte', 'chèque');
CREATE TYPE public.reminder_type AS ENUM ('séance', 'impayé', 'document', 'autre');
CREATE TYPE public.reminder_channel AS ENUM ('email', 'sms', 'whatsapp');
CREATE TYPE public.reminder_status AS ENUM ('planifié', 'envoyé', 'échoué');
CREATE TYPE public.expense_type AS ENUM ('directe', 'fixe');

-- Invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  type public.invoice_type NOT NULL DEFAULT 'facture',
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status public.invoice_status NOT NULL DEFAULT 'brouillon',
  total_ht NUMERIC NOT NULL DEFAULT 0,
  tva_amount NUMERIC NOT NULL DEFAULT 0,
  total_ttc NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  converted_from_id UUID REFERENCES public.invoices(id),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice lines
CREATE TABLE public.invoice_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_ht NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  method public.payment_method NOT NULL DEFAULT 'carte',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reminders
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type public.reminder_type NOT NULL DEFAULT 'autre',
  channel public.reminder_channel NOT NULL DEFAULT 'email',
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  message TEXT NOT NULL DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  status public.reminder_status NOT NULL DEFAULT 'planifié',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL DEFAULT '',
  file_size TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  type public.expense_type NOT NULL DEFAULT 'directe',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_period TEXT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at triggers
CREATE TRIGGER set_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS on all tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Invoices RLS
CREATE POLICY "Members can view invoices" ON public.invoices FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Owner/Admin/Accountant can create invoices" ON public.invoices FOR INSERT WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin','accountant']::app_role[]));
CREATE POLICY "Owner/Admin/Accountant can update invoices" ON public.invoices FOR UPDATE USING (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin','accountant']::app_role[]));
CREATE POLICY "Owner/Admin can delete invoices" ON public.invoices FOR DELETE USING (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin']::app_role[]));

-- Invoice lines RLS (through invoice)
CREATE POLICY "Members can view invoice lines" ON public.invoice_lines FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND is_org_member(auth.uid(), i.organization_id))
);
CREATE POLICY "Owner/Admin/Accountant can create invoice lines" ON public.invoice_lines FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND has_any_role(auth.uid(), i.organization_id, ARRAY['owner','admin','accountant']::app_role[]))
);
CREATE POLICY "Owner/Admin/Accountant can update invoice lines" ON public.invoice_lines FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND has_any_role(auth.uid(), i.organization_id, ARRAY['owner','admin','accountant']::app_role[]))
);
CREATE POLICY "Owner/Admin/Accountant can delete invoice lines" ON public.invoice_lines FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND has_any_role(auth.uid(), i.organization_id, ARRAY['owner','admin','accountant']::app_role[]))
);

-- Payments RLS
CREATE POLICY "Members can view payments" ON public.payments FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Owner/Admin/Accountant can create payments" ON public.payments FOR INSERT WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin','accountant']::app_role[]));
CREATE POLICY "Owner/Admin/Accountant can update payments" ON public.payments FOR UPDATE USING (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin','accountant']::app_role[]));
CREATE POLICY "Owner/Admin can delete payments" ON public.payments FOR DELETE USING (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin']::app_role[]));

-- Reminders RLS
CREATE POLICY "Members can view reminders" ON public.reminders FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Owner/Admin can create reminders" ON public.reminders FOR INSERT WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin']::app_role[]));
CREATE POLICY "Owner/Admin can update reminders" ON public.reminders FOR UPDATE USING (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin']::app_role[]));
CREATE POLICY "Owner/Admin can delete reminders" ON public.reminders FOR DELETE USING (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin']::app_role[]));

-- Documents RLS
CREATE POLICY "Members can view documents" ON public.documents FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Owner/Admin can create documents" ON public.documents FOR INSERT WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin']::app_role[]));
CREATE POLICY "Owner/Admin can update documents" ON public.documents FOR UPDATE USING (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin']::app_role[]));
CREATE POLICY "Owner/Admin can delete documents" ON public.documents FOR DELETE USING (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin']::app_role[]));

-- Expenses RLS
CREATE POLICY "Members can view expenses" ON public.expenses FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Owner/Admin/Accountant can create expenses" ON public.expenses FOR INSERT WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin','accountant']::app_role[]));
CREATE POLICY "Owner/Admin/Accountant can update expenses" ON public.expenses FOR UPDATE USING (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin','accountant']::app_role[]));
CREATE POLICY "Owner/Admin can delete expenses" ON public.expenses FOR DELETE USING (has_any_role(auth.uid(), organization_id, ARRAY['owner','admin']::app_role[]));

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage RLS
CREATE POLICY "Members can view documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'documents' AND EXISTS (
    SELECT 1 FROM organization_members om WHERE om.user_id = auth.uid()
  )
);
CREATE POLICY "Owner/Admin can upload documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin')
  )
);
CREATE POLICY "Owner/Admin can delete documents" ON storage.objects FOR DELETE USING (
  bucket_id = 'documents' AND EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin')
  )
);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
