
-- Create a security definer function to check if user is already an owner
CREATE OR REPLACE FUNCTION public.user_is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  );
$$;

-- Drop old INSERT policy and recreate with security definer function
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT TO authenticated
WITH CHECK (NOT public.user_is_owner(auth.uid()));
