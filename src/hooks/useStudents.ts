import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

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
    mutationFn: async (input: Omit<TablesInsert<"students">, "organization_id">) => {
      const { error } = await supabase.from("students").insert({ ...input, organization_id: orgId! });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("Élève créé"); },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & TablesUpdate<"students">) => {
      const { error } = await supabase.from("students").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("Élève mis à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const update: TablesUpdate<"students"> = { status: "archive" };
      const { error } = await supabase.from("students").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("Élève archivé"); },
    onError: () => toast.error("Erreur lors de l'archivage"),
  });

  return { ...query, students: query.data ?? [], create, update, archive };
}
