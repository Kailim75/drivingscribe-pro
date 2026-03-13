
-- 1. Instructor availabilities (weekly recurring slots)
CREATE TABLE public.instructor_availabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instructor_id, day_of_week, start_time)
);

ALTER TABLE public.instructor_availabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view availabilities" ON public.instructor_availabilities
  FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Owner/Admin can create availabilities" ON public.instructor_availabilities
  FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'instructor'::app_role]));

CREATE POLICY "Owner/Admin can update availabilities" ON public.instructor_availabilities
  FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'instructor'::app_role]));

CREATE POLICY "Owner/Admin can delete availabilities" ON public.instructor_availabilities
  FOR DELETE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'instructor'::app_role]));

-- 2. Skill categories for driving competency tracking
CREATE TABLE public.skill_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view skill categories" ON public.skill_categories
  FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Owner/Admin can manage skill categories" ON public.skill_categories
  FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

CREATE POLICY "Owner/Admin can update skill categories" ON public.skill_categories
  FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

CREATE POLICY "Owner/Admin can delete skill categories" ON public.skill_categories
  FOR DELETE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- 3. Skill evaluations (per lesson per student)
CREATE TABLE public.skill_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES public.skill_categories(id) ON DELETE CASCADE,
  score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  note TEXT NOT NULL DEFAULT '',
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view evaluations" ON public.skill_evaluations
  FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Owner/Admin/Instructor can create evaluations" ON public.skill_evaluations
  FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'instructor'::app_role]));

CREATE POLICY "Owner/Admin/Instructor can update evaluations" ON public.skill_evaluations
  FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role, 'instructor'::app_role]));

CREATE POLICY "Owner/Admin can delete evaluations" ON public.skill_evaluations
  FOR DELETE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

-- 4. Notification preferences table
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reminder_before_hours INT NOT NULL DEFAULT 24,
  notify_instructor_on_change BOOLEAN NOT NULL DEFAULT true,
  notify_student_on_change BOOLEAN NOT NULL DEFAULT true,
  auto_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view notification settings" ON public.notification_settings
  FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Owner/Admin can manage notification settings" ON public.notification_settings
  FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));

CREATE POLICY "Owner/Admin can update notification settings" ON public.notification_settings
  FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), organization_id, ARRAY['owner'::app_role, 'admin'::app_role]));
