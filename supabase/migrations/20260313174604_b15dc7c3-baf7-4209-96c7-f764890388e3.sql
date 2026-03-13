
CREATE OR REPLACE FUNCTION public.admin_get_global_stats()
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'owner') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_build_object(
    'total_organizations', (SELECT count(*) FROM organizations),
    'total_users', (SELECT count(DISTINCT user_id) FROM organization_members),
    'total_students', (SELECT count(*) FROM students),
    'total_instructors', (SELECT count(*) FROM instructors),
    'total_lessons', (SELECT count(*) FROM lessons),
    'total_invoices', (SELECT count(*) FROM invoices),
    'organizations', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT 
          o.id, o.name, o.email, o.mode, o.created_at, o.suspended,
          (SELECT count(*) FROM students s WHERE s.organization_id = o.id) as student_count,
          (SELECT count(*) FROM instructors i WHERE i.organization_id = o.id) as instructor_count,
          (SELECT count(*) FROM lessons l WHERE l.organization_id = o.id) as lesson_count,
          (SELECT count(*) FROM organization_members om WHERE om.organization_id = o.id) as member_count
        FROM organizations o
        ORDER BY o.created_at DESC
      ) t
    ),
    'users', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT 
          p.user_id, p.first_name, p.last_name, p.created_at, p.suspended,
          (SELECT json_agg(json_build_object('org_name', o.name, 'role', ur.role))
           FROM user_roles ur
           JOIN organizations o ON o.id = ur.organization_id
           WHERE ur.user_id = p.user_id
          ) as org_roles
        FROM profiles p
        ORDER BY p.created_at DESC
      ) t
    ),
    'signups_per_month', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT 
          to_char(date_trunc('month', p.created_at), 'YYYY-MM') as month,
          count(*) as count
        FROM profiles p
        WHERE p.created_at >= (now() - interval '12 months')
        GROUP BY date_trunc('month', p.created_at)
        ORDER BY date_trunc('month', p.created_at)
      ) t
    ),
    'lessons_per_week', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT 
          to_char(date_trunc('week', l.date::timestamp), 'YYYY-MM-DD') as week,
          count(*) as count
        FROM lessons l
        WHERE l.date >= (CURRENT_DATE - interval '12 weeks')
        GROUP BY date_trunc('week', l.date::timestamp)
        ORDER BY date_trunc('week', l.date::timestamp)
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$function$;
