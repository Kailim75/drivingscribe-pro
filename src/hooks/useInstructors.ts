import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export function useInstructors() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["instructors", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("*")
        .eq("organization_id", orgId!)
        .order("last_name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const create = useMutation({
    mutationFn: async (input: { first_name: string; last_name: string; phone?: string; email?: string; hourly_cost?: number; specialties?: string[]; notes?: string }) => {
      const { error } = await supabase.from("instructors").insert({ ...input, organization_id: orgId! });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["instructors"] }); toast.success("Formateur créé"); },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from("instructors").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["instructors"] }); toast.success("Formateur mis à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instructors").update({ status: "archive" as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["instructors"] }); toast.success("Formateur archivé"); },
    onError: () => toast.error("Erreur lors de l'archivage"),
  });

  return { ...query, instructors: query.data ?? [], create, update, archive };
}
