
-- Fix: restrict org creation to authenticated users only (already scoped to authenticated)
-- The WITH CHECK (true) is intentional here because any authenticated user
-- should be able to create ONE organization during onboarding.
-- We add a function to ensure a user can only create if they don't already own one.

DROP POLICY "Authenticated users can create organizations" ON public.organizations;

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow creation only if the user doesn't already own an organization
    NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'owner'
    )
  );
