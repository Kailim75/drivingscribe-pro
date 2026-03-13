
-- Fix privilege escalation: Admins cannot assign 'owner' role to themselves or others
DROP POLICY IF EXISTS "Owner/Admin can assign roles" ON public.user_roles;

CREATE POLICY "Owner/Admin can assign roles (restricted)"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  -- Owners can assign any role
  has_role(auth.uid(), organization_id, 'owner'::app_role)
  OR
  -- Admins can assign non-owner roles only
  (role <> 'owner'::app_role AND has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]))
);
