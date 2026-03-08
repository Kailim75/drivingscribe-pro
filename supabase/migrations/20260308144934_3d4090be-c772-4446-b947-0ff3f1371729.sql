
-- =============================================
-- SPRINT 2: Core business tables
-- =============================================

-- Enums
CREATE TYPE public.student_status AS ENUM ('actif', 'en_pause', 'termine', 'archive');
CREATE TYPE public.instructor_status AS ENUM ('actif', 'inactif', 'archive');
CREATE TYPE public.vehicle_status AS ENUM ('actif', 'indisponible', 'maintenance', 'archive');
CREATE TYPE public.lesson_status AS ENUM ('prevu', 'effectue', 'annule', 'absent');
CREATE TYPE public.billing_rule AS ENUM ('totale', 'partielle', 'non_facturee');
CREATE TYPE public.offer_type AS ENUM ('heure', 'pack', 'forfait');

-- =============================================
-- STUDENTS
-- =============================================
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  activity_type text NOT NULL DEFAULT 'auto_ecole',
  status public.student_status NOT NULL DEFAULT 'actif',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Members can view students" ON public.students FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Owner/Admin can create students" ON public.students FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'instructor'::app_role]));
CREATE POLICY "Owner/Admin can update students" ON public.students FOR UPDATE
  USING (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'instructor'::app_role]));
CREATE POLICY "Owner/Admin can delete students" ON public.students FOR DELETE
  USING (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- =============================================
-- INSTRUCTORS
-- =============================================
CREATE TABLE public.instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  status public.instructor_status NOT NULL DEFAULT 'actif',
  hourly_cost numeric NOT NULL DEFAULT 0,
  specialties text[] NOT NULL DEFAULT '{}',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_instructors_updated_at BEFORE UPDATE ON public.instructors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Members can view instructors" ON public.instructors FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Owner/Admin can create instructors" ON public.instructors FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
CREATE POLICY "Owner/Admin can update instructors" ON public.instructors FOR UPDATE
  USING (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
CREATE POLICY "Owner/Admin can delete instructors" ON public.instructors FOR DELETE
  USING (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- =============================================
-- VEHICLES
-- =============================================
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plate text NOT NULL,
  brand text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'auto_ecole',
  status public.vehicle_status NOT NULL DEFAULT 'actif',
  monthly_cost numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Members can view vehicles" ON public.vehicles FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Owner/Admin can create vehicles" ON public.vehicles FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
CREATE POLICY "Owner/Admin can update vehicles" ON public.vehicles FOR UPDATE
  USING (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
CREATE POLICY "Owner/Admin can delete vehicles" ON public.vehicles FOR DELETE
  USING (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- =============================================
-- OFFERS (catalogue)
-- =============================================
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.offer_type NOT NULL DEFAULT 'heure',
  price numeric NOT NULL DEFAULT 0,
  hours numeric,
  tva_rate numeric NOT NULL DEFAULT 20,
  deposit_percent numeric NOT NULL DEFAULT 0,
  cancellation_policy text NOT NULL DEFAULT '',
  activity_type text NOT NULL DEFAULT 'auto_ecole',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Members can view offers" ON public.offers FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Owner/Admin can create offers" ON public.offers FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
CREATE POLICY "Owner/Admin can update offers" ON public.offers FOR UPDATE
  USING (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
CREATE POLICY "Owner/Admin can delete offers" ON public.offers FOR DELETE
  USING (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- =============================================
-- STUDENT_FORMULAS (bought packages)
-- =============================================
CREATE TABLE public.student_formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  offer_name text NOT NULL,
  offer_type public.offer_type NOT NULL DEFAULT 'heure',
  hours_bought numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_formulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view student formulas" ON public.student_formulas FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Owner/Admin can create student formulas" ON public.student_formulas FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
CREATE POLICY "Owner/Admin can update student formulas" ON public.student_formulas FOR UPDATE
  USING (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- =============================================
-- LESSONS
-- =============================================
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  formula_id uuid REFERENCES public.student_formulas(id) ON DELETE SET NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_hours numeric NOT NULL DEFAULT 1,
  status public.lesson_status NOT NULL DEFAULT 'prevu',
  billing_rule public.billing_rule NOT NULL DEFAULT 'totale',
  billable_amount numeric NOT NULL DEFAULT 0,
  billed_amount numeric NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Members can view lessons" ON public.lessons FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Owner/Admin/Instructor can create lessons" ON public.lessons FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'instructor'::app_role]));
CREATE POLICY "Owner/Admin/Instructor can update lessons" ON public.lessons FOR UPDATE
  USING (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'instructor'::app_role]));
CREATE POLICY "Owner/Admin can delete lessons" ON public.lessons FOR DELETE
  USING (public.has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- =============================================
-- FUNCTION: Check scheduling conflicts
-- =============================================
CREATE OR REPLACE FUNCTION public.check_lesson_conflicts(
  _organization_id uuid,
  _instructor_id uuid,
  _vehicle_id uuid,
  _date date,
  _start_time time,
  _end_time time,
  _exclude_lesson_id uuid DEFAULT NULL
)
RETURNS TABLE(conflict_type text, conflicting_id uuid, conflicting_label text) 
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  -- Instructor conflicts
  SELECT 
    'instructor'::text as conflict_type,
    l.id as conflicting_id,
    (i.first_name || ' ' || i.last_name)::text as conflicting_label
  FROM lessons l
  JOIN instructors i ON i.id = l.instructor_id
  WHERE l.organization_id = _organization_id
    AND l.instructor_id = _instructor_id
    AND l.date = _date
    AND l.status IN ('prevu', 'effectue')
    AND (l.id IS DISTINCT FROM _exclude_lesson_id)
    AND l.start_time < _end_time
    AND l.end_time > _start_time
  UNION ALL
  -- Vehicle conflicts
  SELECT
    'vehicle'::text as conflict_type,
    l.id as conflicting_id,
    (v.brand || ' ' || v.model || ' (' || v.plate || ')')::text as conflicting_label
  FROM lessons l
  JOIN vehicles v ON v.id = l.vehicle_id
  WHERE l.organization_id = _organization_id
    AND l.vehicle_id = _vehicle_id
    AND l.date = _date
    AND l.status IN ('prevu', 'effectue')
    AND (l.id IS DISTINCT FROM _exclude_lesson_id)
    AND l.start_time < _end_time
    AND l.end_time > _start_time;
$$;
