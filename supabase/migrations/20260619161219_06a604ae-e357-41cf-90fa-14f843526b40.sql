
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'activity_types','audit_logs','documents','expenses','instructor_availabilities',
    'instructors','invoice_lines','invoices','lessons','notification_settings','offers',
    'organization_members','organizations','payers','payments','profiles','reminders',
    'skill_categories','skill_evaluations','student_formulas','students','user_roles','vehicles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;
