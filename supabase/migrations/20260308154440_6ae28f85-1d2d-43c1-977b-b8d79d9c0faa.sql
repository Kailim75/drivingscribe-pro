
-- Fix: recreate as PERMISSIVE (default behavior)
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view their organization" ON public.organizations;
CREATE POLICY "Members can view their organization"
ON public.organizations FOR SELECT TO authenticated
USING (id IN (SELECT get_user_org_ids(auth.uid())));

DROP POLICY IF EXISTS "Owner/Admin can update organization" ON public.organizations;
CREATE POLICY "Owner/Admin can update organization"
ON public.organizations FOR UPDATE TO authenticated
USING (has_any_role(auth.uid(), id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- Fix organization_members INSERT policy
DROP POLICY IF EXISTS "Owner/Admin can add members" ON public.organization_members;
CREATE POLICY "Owner/Admin can add members"
ON public.organization_members FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
CREATE POLICY "Members can view org members"
ON public.organization_members FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Owner/Admin can remove members" ON public.organization_members;
CREATE POLICY "Owner/Admin can remove members"
ON public.organization_members FOR DELETE TO authenticated
USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- Fix user_roles policies
DROP POLICY IF EXISTS "Owner/Admin can assign roles" ON public.user_roles;
CREATE POLICY "Owner/Admin can assign roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Members can view roles in their org" ON public.user_roles;
CREATE POLICY "Members can view roles in their org"
ON public.user_roles FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Owner can remove roles" ON public.user_roles;
CREATE POLICY "Owner can remove roles"
ON public.user_roles FOR DELETE TO authenticated
USING (has_role(auth.uid(), organization_id, 'owner'::app_role));

-- Fix activity_types policies
DROP POLICY IF EXISTS "Members can view activity types" ON public.activity_types;
CREATE POLICY "Members can view activity types"
ON public.activity_types FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

DROP POLICY IF EXISTS "Owner/Admin can manage activity types" ON public.activity_types;
CREATE POLICY "Owner/Admin can manage activity types"
ON public.activity_types FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

DROP POLICY IF EXISTS "Owner/Admin can update activity types" ON public.activity_types;
CREATE POLICY "Owner/Admin can update activity types"
ON public.activity_types FOR UPDATE TO authenticated
USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- Fix audit_logs policies
DROP POLICY IF EXISTS "Members can create audit logs" ON public.audit_logs;
CREATE POLICY "Members can create audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));

DROP POLICY IF EXISTS "Members can view audit logs" ON public.audit_logs;
CREATE POLICY "Members can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- Fix profiles policies
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view profiles in their org" ON public.profiles;
CREATE POLICY "Users can view profiles in their org"
ON public.profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR user_id IN (SELECT om.user_id FROM organization_members om WHERE om.organization_id IN (SELECT get_user_org_ids(auth.uid()))));

-- Fix all other tables: students, instructors, vehicles, lessons, offers, invoices, invoice_lines, payments, expenses, reminders, documents, student_formulas

-- students
DROP POLICY IF EXISTS "Members can view students" ON public.students;
CREATE POLICY "Members can view students" ON public.students FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
DROP POLICY IF EXISTS "Owner/Admin can create students" ON public.students;
CREATE POLICY "Owner/Admin can create students" ON public.students FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'instructor'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can update students" ON public.students;
CREATE POLICY "Owner/Admin can update students" ON public.students FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'instructor'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can delete students" ON public.students;
CREATE POLICY "Owner/Admin can delete students" ON public.students FOR DELETE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- instructors
DROP POLICY IF EXISTS "Members can view instructors" ON public.instructors;
CREATE POLICY "Members can view instructors" ON public.instructors FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
DROP POLICY IF EXISTS "Owner/Admin can create instructors" ON public.instructors;
CREATE POLICY "Owner/Admin can create instructors" ON public.instructors FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can update instructors" ON public.instructors;
CREATE POLICY "Owner/Admin can update instructors" ON public.instructors FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can delete instructors" ON public.instructors;
CREATE POLICY "Owner/Admin can delete instructors" ON public.instructors FOR DELETE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- vehicles
DROP POLICY IF EXISTS "Members can view vehicles" ON public.vehicles;
CREATE POLICY "Members can view vehicles" ON public.vehicles FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
DROP POLICY IF EXISTS "Owner/Admin can create vehicles" ON public.vehicles;
CREATE POLICY "Owner/Admin can create vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can update vehicles" ON public.vehicles;
CREATE POLICY "Owner/Admin can update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can delete vehicles" ON public.vehicles;
CREATE POLICY "Owner/Admin can delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- lessons
DROP POLICY IF EXISTS "Members can view lessons" ON public.lessons;
CREATE POLICY "Members can view lessons" ON public.lessons FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
DROP POLICY IF EXISTS "Owner/Admin/Instructor can create lessons" ON public.lessons;
CREATE POLICY "Owner/Admin/Instructor can create lessons" ON public.lessons FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'instructor'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin/Instructor can update lessons" ON public.lessons;
CREATE POLICY "Owner/Admin/Instructor can update lessons" ON public.lessons FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'instructor'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can delete lessons" ON public.lessons;
CREATE POLICY "Owner/Admin can delete lessons" ON public.lessons FOR DELETE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- offers
DROP POLICY IF EXISTS "Members can view offers" ON public.offers;
CREATE POLICY "Members can view offers" ON public.offers FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
DROP POLICY IF EXISTS "Owner/Admin can create offers" ON public.offers;
CREATE POLICY "Owner/Admin can create offers" ON public.offers FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can update offers" ON public.offers;
CREATE POLICY "Owner/Admin can update offers" ON public.offers FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can delete offers" ON public.offers;
CREATE POLICY "Owner/Admin can delete offers" ON public.offers FOR DELETE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- invoices
DROP POLICY IF EXISTS "Members can view invoices" ON public.invoices;
CREATE POLICY "Members can view invoices" ON public.invoices FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
DROP POLICY IF EXISTS "Owner/Admin/Accountant can create invoices" ON public.invoices;
CREATE POLICY "Owner/Admin/Accountant can create invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'accountant'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin/Accountant can update invoices" ON public.invoices;
CREATE POLICY "Owner/Admin/Accountant can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'accountant'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can delete invoices" ON public.invoices;
CREATE POLICY "Owner/Admin can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- invoice_lines
DROP POLICY IF EXISTS "Members can view invoice lines" ON public.invoice_lines;
CREATE POLICY "Members can view invoice lines" ON public.invoice_lines FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND is_org_member(auth.uid(), i.organization_id)));
DROP POLICY IF EXISTS "Owner/Admin/Accountant can create invoice lines" ON public.invoice_lines;
CREATE POLICY "Owner/Admin/Accountant can create invoice lines" ON public.invoice_lines FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND has_any_role(auth.uid(), i.organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'accountant'::app_role])));
DROP POLICY IF EXISTS "Owner/Admin/Accountant can update invoice lines" ON public.invoice_lines;
CREATE POLICY "Owner/Admin/Accountant can update invoice lines" ON public.invoice_lines FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND has_any_role(auth.uid(), i.organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'accountant'::app_role])));
DROP POLICY IF EXISTS "Owner/Admin/Accountant can delete invoice lines" ON public.invoice_lines;
CREATE POLICY "Owner/Admin/Accountant can delete invoice lines" ON public.invoice_lines FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND has_any_role(auth.uid(), i.organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'accountant'::app_role])));

-- payments
DROP POLICY IF EXISTS "Members can view payments" ON public.payments;
CREATE POLICY "Members can view payments" ON public.payments FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
DROP POLICY IF EXISTS "Owner/Admin/Accountant can create payments" ON public.payments;
CREATE POLICY "Owner/Admin/Accountant can create payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'accountant'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin/Accountant can update payments" ON public.payments;
CREATE POLICY "Owner/Admin/Accountant can update payments" ON public.payments FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'accountant'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can delete payments" ON public.payments;
CREATE POLICY "Owner/Admin can delete payments" ON public.payments FOR DELETE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- expenses
DROP POLICY IF EXISTS "Members can view expenses" ON public.expenses;
CREATE POLICY "Members can view expenses" ON public.expenses FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
DROP POLICY IF EXISTS "Owner/Admin/Accountant can create expenses" ON public.expenses;
CREATE POLICY "Owner/Admin/Accountant can create expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'accountant'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin/Accountant can update expenses" ON public.expenses;
CREATE POLICY "Owner/Admin/Accountant can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'accountant'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can delete expenses" ON public.expenses;
CREATE POLICY "Owner/Admin can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- reminders
DROP POLICY IF EXISTS "Members can view reminders" ON public.reminders;
CREATE POLICY "Members can view reminders" ON public.reminders FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
DROP POLICY IF EXISTS "Owner/Admin can create reminders" ON public.reminders;
CREATE POLICY "Owner/Admin can create reminders" ON public.reminders FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can update reminders" ON public.reminders;
CREATE POLICY "Owner/Admin can update reminders" ON public.reminders FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can delete reminders" ON public.reminders;
CREATE POLICY "Owner/Admin can delete reminders" ON public.reminders FOR DELETE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- documents
DROP POLICY IF EXISTS "Members can view documents" ON public.documents;
CREATE POLICY "Members can view documents" ON public.documents FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
DROP POLICY IF EXISTS "Owner/Admin can create documents" ON public.documents;
CREATE POLICY "Owner/Admin can create documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can update documents" ON public.documents;
CREATE POLICY "Owner/Admin can update documents" ON public.documents FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can delete documents" ON public.documents;
CREATE POLICY "Owner/Admin can delete documents" ON public.documents FOR DELETE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- student_formulas
DROP POLICY IF EXISTS "Members can view student formulas" ON public.student_formulas;
CREATE POLICY "Members can view student formulas" ON public.student_formulas FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
DROP POLICY IF EXISTS "Owner/Admin can create student formulas" ON public.student_formulas;
CREATE POLICY "Owner/Admin can create student formulas" ON public.student_formulas FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
DROP POLICY IF EXISTS "Owner/Admin can update student formulas" ON public.student_formulas;
CREATE POLICY "Owner/Admin can update student formulas" ON public.student_formulas FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
