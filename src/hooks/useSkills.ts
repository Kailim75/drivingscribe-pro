import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface SkillCategory {
  id: string;
  name: string;
  sort_order: number;
}

export interface SkillEvaluation {
  id: string;
  student_id: string;
  lesson_id: string | null;
  instructor_id: string | null;
  category_id: string;
  score: number;
  note: string;
  evaluated_at: string;
}

export function useSkillCategories() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["skill_categories", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_categories")
        .select("*")
        .eq("organization_id", orgId!)
        .order("sort_order");
      if (error) throw error;
      return data as SkillCategory[];
    },
    enabled: !!orgId,
  });

  const create = useMutation({
    mutationFn: async (name: string) => {
      const maxOrder = (query.data || []).reduce((m, c) => Math.max(m, c.sort_order), 0);
      const { error } = await supabase.from("skill_categories").insert({
        organization_id: orgId!,
        name,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill_categories"] }); toast.success("Compétence ajoutée"); },
    onError: () => toast.error("Erreur"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skill_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill_categories"] }); toast.success("Compétence supprimée"); },
    onError: () => toast.error("Erreur"),
  });

  const reorder = useMutation({
    mutationFn: async (ordered: { id: string; sort_order: number }[]) => {
      const updates = ordered.map((item) =>
        supabase.from("skill_categories").update({ sort_order: item.sort_order }).eq("id", item.id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill_categories"] }); },
    onError: () => toast.error("Erreur de réordonnancement"),
  });

  return { ...query, categories: query.data ?? [], create, remove, reorder };
}

export function useSkillEvaluations(studentId?: string) {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["skill_evaluations", orgId, studentId],
    queryFn: async () => {
      let q = supabase
        .from("skill_evaluations")
        .select("*")
        .eq("organization_id", orgId!)
        .order("evaluated_at", { ascending: false });
      if (studentId) q = q.eq("student_id", studentId);
      const { data, error } = await q;
      if (error) throw error;
      return data as SkillEvaluation[];
    },
    enabled: !!orgId && !!studentId,
  });

  const evaluate = useMutation({
    mutationFn: async (input: {
      student_id: string;
      lesson_id?: string;
      instructor_id?: string;
      evaluations: { category_id: string; score: number; note?: string }[];
    }) => {
      const rows = input.evaluations.map((e) => ({
        organization_id: orgId!,
        student_id: input.student_id,
        lesson_id: input.lesson_id || null,
        instructor_id: input.instructor_id || null,
        category_id: e.category_id,
        score: e.score,
        note: e.note || "",
      }));
      const { error } = await supabase.from("skill_evaluations").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill_evaluations"] });
      toast.success("Évaluation enregistrée");
    },
    onError: () => toast.error("Erreur lors de l'évaluation"),
  });

  return { ...query, evaluations: query.data ?? [], evaluate };
}
