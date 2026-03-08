import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export function useStudentFormulas(studentId?: string) {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["student_formulas", orgId, studentId],
    queryFn: async () => {
      let q = supabase
        .from("student_formulas")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (studentId) q = q.eq("student_id", studentId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const create = useMutation({
    mutationFn: async (input: {
      student_id: string; offer_id?: string; offer_name: string;
      offer_type?: string; hours_bought: number; total_price: number;
    }) => {
      const { error } = await supabase.from("student_formulas").insert({
        ...input,
        organization_id: orgId!,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["student_formulas"] }); toast.success("Formule ajoutée"); },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from("student_formulas").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["student_formulas"] }); },
    onError: () => toast.error("Erreur"),
  });

  return { ...query, formulas: query.data ?? [], create, update };
}
