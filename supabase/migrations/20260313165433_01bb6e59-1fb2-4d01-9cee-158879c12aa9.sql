
-- Add suspended column to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- Add suspended column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- Admin function to suspend/unsuspend an organization
CREATE OR REPLACE FUNCTION public.admin_suspend_organization(_org_id uuid, _suspended boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'owner') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  UPDATE organizations SET suspended = _suspended, updated_at = now() WHERE id = _org_id;
END;
$$;

-- Admin function to delete an organization and all its data
CREATE OR REPLACE FUNCTION public.admin_delete_organization(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'owner') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  -- Delete in dependency order
  DELETE FROM audit_logs WHERE organization_id = _org_id;
  DELETE FROM reminders WHERE organization_id = _org_id;
  DELETE FROM documents WHERE organization_id = _org_id;
  DELETE FROM invoice_lines WHERE invoice_id IN (SELECT id FROM invoices WHERE organization_id = _org_id);
  DELETE FROM payments WHERE organization_id = _org_id;
  DELETE FROM invoices WHERE organization_id = _org_id;
  DELETE FROM lessons WHERE organization_id = _org_id;
  DELETE FROM student_formulas WHERE organization_id = _org_id;
  DELETE FROM expenses WHERE organization_id = _org_id;
  DELETE FROM students WHERE organization_id = _org_id;
  DELETE FROM instructors WHERE organization_id = _org_id;
  DELETE FROM vehicles WHERE organization_id = _org_id;
  DELETE FROM offers WHERE organization_id = _org_id;
  DELETE FROM activity_types WHERE organization_id = _org_id;
  DELETE FROM user_roles WHERE organization_id = _org_id;
  DELETE FROM organization_members WHERE organization_id = _org_id;
  DELETE FROM organizations WHERE id = _org_id;
END;
$$;

-- Admin function to suspend/unsuspend a user
CREATE OR REPLACE FUNCTION public.admin_suspend_user(_user_id uuid, _suspended boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'owner') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  -- Don't allow suspending yourself
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot suspend yourself';
  END IF;
  UPDATE profiles SET suspended = _suspended, updated_at = now() WHERE user_id = _user_id;
END;
$$;

-- Admin function to delete a user (remove from all orgs/roles + profile)
CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'owner') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;
  DELETE FROM user_roles WHERE user_id = _user_id;
  DELETE FROM organization_members WHERE user_id = _user_id;
  DELETE FROM profiles WHERE user_id = _user_id;
END;
$$;
