import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface LessonConflict {
  conflict_type: string;
  conflicting_id: string;
  conflicting_label: string;
}

export function useLessons(filters?: { date?: string; dateFrom?: string; dateTo?: string; instructorId?: string; studentId?: string }) {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["lessons", orgId, filters],
    queryFn: async () => {
      let q = supabase
        .from("lessons")
        .select("*, students!inner(first_name, last_name), instructors!inner(first_name, last_name), vehicles!inner(brand, model, plate)")
        .eq("organization_id", orgId!)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (filters?.date) q = q.eq("date", filters.date);
      if (filters?.dateFrom) q = q.gte("date", filters.dateFrom);
      if (filters?.dateTo) q = q.lte("date", filters.dateTo);
      if (filters?.instructorId) q = q.eq("instructor_id", filters.instructorId);
      if (filters?.studentId) q = q.eq("student_id", filters.studentId);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const checkConflicts = async (params: {
    instructor_id: string; vehicle_id: string; date: string;
    start_time: string; end_time: string; exclude_lesson_id?: string;
  }): Promise<LessonConflict[]> => {
    const { data, error } = await supabase.rpc("check_lesson_conflicts", {
      _organization_id: orgId!,
      _instructor_id: params.instructor_id,
      _vehicle_id: params.vehicle_id,
      _date: params.date,
      _start_time: params.start_time,
      _end_time: params.end_time,
      _exclude_lesson_id: params.exclude_lesson_id || null,
    });
    if (error) throw error;
    return (data as any) ?? [];
  };

  const create = useMutation({
    mutationFn: async (input: {
      student_id: string; instructor_id: string; vehicle_id: string;
      date: string; start_time: string; end_time: string; duration_hours: number;
      formula_id?: string; note?: string; billable_amount?: number;
    }) => {
      const { error } = await supabase.from("lessons").insert({
        ...input,
        organization_id: orgId!,
        status: "prevu" as any,
        billing_rule: "totale" as any,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lessons"] }); toast.success("Séance créée"); },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from("lessons").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lessons"] }); toast.success("Séance mise à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("lessons").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lessons"] }); toast.success("Statut mis à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lessons"] }); toast.success("Séance supprimée"); },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return { ...query, lessons: query.data ?? [], checkConflicts, create, update, updateStatus, remove };
}
