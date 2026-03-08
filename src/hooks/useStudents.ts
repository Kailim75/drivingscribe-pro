import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export function useStudents() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["students", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("organization_id", orgId!)
        .order("last_name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const create = useMutation({
    mutationFn: async (input: { first_name: string; last_name: string; phone?: string; email?: string; address?: string; activity_type?: string; notes?: string }) => {
      const { error } = await supabase.from("students").insert({ ...input, organization_id: orgId! });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("Élève créé"); },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from("students").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("Élève mis à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("Élève supprimé"); },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return { ...query, students: query.data ?? [], create, update, remove };
}
